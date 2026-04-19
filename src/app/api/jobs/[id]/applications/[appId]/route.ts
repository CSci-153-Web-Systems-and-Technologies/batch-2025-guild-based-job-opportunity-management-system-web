import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'
import { getAuthenticatedUserWithProfile } from '@/lib/auth'
import { isUserAdmin, checkResourceOwnership } from '@/lib/permissions'
import * as logger from '@/lib/logger'

const ALLOWED_STATUSES = ['pending', 'applied', 'accepted', 'rejected', 'completed'] as const
type StatusType = (typeof ALLOWED_STATUSES)[number]

/**
 * Job row with owner and slot information.
 */
interface JobWithSlots {
  id: string
  created_by: string
  slots: number
  reward_xp: number
}

/**
 * Job application record from the job_applications table.
 */
interface JobApplication {
  id: string
  job_id: string
  user_id: string
  status: string
}

/**
 * Slots update result.
 */
interface JobSlotsUpdate {
  id: string
  slots: number
}

/**
 * User stats row.
 */
interface UserStats {
  xp: number
  user_id?: string
  current_rank_id?: number
}

/**
 * Route parameter context type.
 */
interface RouteContext {
  params: Promise<Record<string, string>> | Record<string, string>
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient()
    const authResult = await getAuthenticatedUserWithProfile(supabase)
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: 401 })
    // After error check, user and profile are guaranteed non-null
    const user = authResult.user!
    const profile = authResult.profile!

    const effectiveProfileId = profile.id
    if (!effectiveProfileId) return NextResponse.json({ error: 'Profile has no id' }, { status: 500 })

    // resolve params (may be a Promise in some Next.js versions)
    const rawParams = context?.params
    const params = rawParams instanceof Promise ? await rawParams : rawParams
    const jobId = params?.id
    const appId = params?.appId

    // fetch application and verify it belongs to job
    const { data: appData, error: appErr } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', appId)
      .eq('job_id', jobId)
      .maybeSingle()

    if (appErr) return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
    if (!appData) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    // fetch job
    const { data: jobData, error: jobErr } = await supabase
      .from('jobs')
      .select('id, created_by, slots, reward_xp')
      .eq('id', jobId)
      .maybeSingle()
    if (jobErr) return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
    if (!jobData) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const job = jobData as JobWithSlots

    // check permission: must be job owner or admin
    const isAdmin = await isUserAdmin(supabase, profile.role_id)
    if (!checkResourceOwnership(job, user.id, isAdmin, 'job')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const status = typeof body?.status === 'string' ? body.status : undefined
    if (!status || !ALLOWED_STATUSES.includes(status as StatusType)) {
      return NextResponse.json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 })
    }

    // If accepting, atomically claim a slot
    let slotWasDecrementedJob: JobSlotsUpdate | null = null
    if (status === 'accepted') {
      const slots = job.slots
      if (typeof slots !== 'number' || slots <= 0) {
        return NextResponse.json({ error: 'No slots available' }, { status: 400 })
      }

      // Try to decrement the job slots using optimistic concurrency: only update
      // if the slots value matches what we read. This avoids race conditions
      // where two requests attempt to accept simultaneously. If the update affects no rows,
      // treat it as "no slots available".
      const desired = Number(slots) - 1
      const { data: updatedJob, error: jobUpdateErr } = await supabase
        .from('jobs')
        .update({ slots: desired })
        .eq('id', jobId)
        .eq('slots', slots)
        .select('id, slots')
        .maybeSingle()

      if (jobUpdateErr) return NextResponse.json({ error: 'Failed to claim slot' }, { status: 500 })
      if (!updatedJob) {
        // Someone else modified slots concurrently or no slots left
        return NextResponse.json({ error: 'No slots available' }, { status: 409 })
      }
      slotWasDecrementedJob = updatedJob as JobSlotsUpdate
    }

    // Update application status
    const { data: updated, error: updateErr } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', appId)
      .select('*')
      .maybeSingle()

    if (updateErr) {
      // Application update failed. If we had decremented slots, attempt rollback.
      if (slotWasDecrementedJob) {
        try {
          const rollbackSlots = slotWasDecrementedJob.slots + 1
          const { error: rollbackErr } = await supabase
            .from('jobs')
            .update({ slots: rollbackSlots })
            .eq('id', jobId)

          if (rollbackErr) {
            throw rollbackErr
          }
        } catch (rollbackError) {
          // Rollback failed — log structured error for manual intervention
          logger.error('SLOT_ROLLBACK_FAILED', {
            jobId,
            appId,
            originalError: updateErr.message,
            rollbackError: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          })
          return NextResponse.json(
            { error: 'Application update failed. Slot count may be inconsistent. Please contact an administrator.' },
            { status: 500 }
          )
        }
      }
      // Rollback succeeded or no rollback was needed
      return NextResponse.json({ error: 'Application update failed. Please try again.' }, { status: 500 })
    }

    // If completed, award xp to the applicant
    if (status === 'completed') {
      const application = updated as JobApplication | null
      const applicantId = application?.user_id
      const reward = job.reward_xp ?? 0
      try {
        // upsert user_stats row and increment xp
        const { data: current, error: curErr } = await supabase
          .from('user_stats')
          .select('xp')
          .eq('user_id', applicantId)
          .maybeSingle()
        if (curErr) throw curErr
        const stats = current as UserStats | null
        const currentXp = stats?.xp ?? 0
        const newXp = Math.max(0, currentXp + Number(reward))
        await supabase.from('user_stats').upsert({ user_id: applicantId, xp: newXp }, { onConflict: 'user_id' })
      } catch (awardErr) {
        // XP award is non-critical; log for monitoring
        logger.error('xp_award_failed', {
          error: awardErr instanceof Error ? awardErr.message : String(awardErr),
          applicantId,
          jobId,
          reward,
        })
      }
    }

    return NextResponse.json({ application: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
