import toast from 'react-hot-toast'

const successMessages = [
  'Another family treasure preserved.',
  'Recipe saved! Grandma would approve.',
  'That one\'s going in the recipe box.',
  'Saved and ready to share.',
]

const getRandomSuccess = () =>
  successMessages[Math.floor(Math.random() * successMessages.length)]

const brandToast = {
  success(message) {
    return toast(message || getRandomSuccess(), {
      style: {
        background: '#5B7B5A',
        color: '#FFFFFF',
        fontFamily: "'Lora', Georgia, serif",
        borderRadius: '0.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: '12px 16px',
      },
      icon: '\u2713',
      iconTheme: {
        primary: '#FFFFFF',
        secondary: '#5B7B5A',
      },
      duration: 3000,
    })
  },

  error(message) {
    return toast(message || 'Something went wrong. Give it another try.', {
      style: {
        background: '#C4463A',
        color: '#FFFFFF',
        fontFamily: "'Lora', Georgia, serif",
        borderRadius: '0.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: '12px 16px',
      },
      icon: '\u2717',
      iconTheme: {
        primary: '#FFFFFF',
        secondary: '#C4463A',
      },
      duration: 4000,
    })
  },

  info(message) {
    return toast(message || '', {
      style: {
        background: '#D4A44C',
        color: '#3D3029',
        fontFamily: "'Lora', Georgia, serif",
        borderRadius: '0.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: '12px 16px',
      },
      icon: '\u2139',
      iconTheme: {
        primary: '#3D3029',
        secondary: '#D4A44C',
      },
      duration: 3000,
    })
  },
}

export default brandToast
