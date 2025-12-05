import { LoginForm } from '@/components/login-form'
import bg from '@/assets/login-background.jpg'
import styles from '../auth/login/page.module.css'

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
        <LoginForm />
      </div>
    </div>
  )
}
