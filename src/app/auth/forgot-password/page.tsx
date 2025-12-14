import { ForgotPasswordForm } from '@/components/forgot-password-form'
import bg from '@/assets/login-background.jpg'
import styles from '../login/page.module.css'

export default function Page() {
  return (
    <div
      className={styles.container}
      style={{
        backgroundImage: `url(${bg.src})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className={styles.overlay} />
      <div className={`${styles.content} ${styles.contentEnter}`}>
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
