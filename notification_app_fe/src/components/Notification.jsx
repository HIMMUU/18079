import { useEffect, useRef, useState } from 'react'

const NOTIFICATION_API = 'http://20.207.122.201/evaluation-service/notifications'
const BEARER_TOKEN = import.meta.env.VITE_BEARER_TOKEN

export const NotificationComp = () => {
  const [notificationText, setNotificationText] = useState('Loading notifications...')
  const didFetch = useRef(false)

  useEffect(() => {
    function getToken() {
      if (!BEARER_TOKEN) {
        throw new Error('Bearer token missing in client.env')
      }

      const token = BEARER_TOKEN.startsWith('Bearer ')
        ? BEARER_TOKEN
        : `Bearer ${BEARER_TOKEN}`

      localStorage.setItem('Authorization', token)
      return token
    }

    async function getNotifications() {
      try {
        if (didFetch.current) {
          return
        }

        didFetch.current = true

        const headers = {
          Authorization: getToken(),
        }

        const response = await fetch(NOTIFICATION_API, {
          method: 'GET',
          headers,
        })

        const data = await response.json()
        console.log('Notifications:', data)

        if (!response.ok) {
          throw new Error(data.message || 'Could not fetch notifications')
        }

        setNotificationText(JSON.stringify(data))
      } catch (error) {
        console.error('Notification error:', error)
        setNotificationText(error.message)
      }
    }

    getNotifications()
  }, [])

  return <p>{notificationText}</p>
}
