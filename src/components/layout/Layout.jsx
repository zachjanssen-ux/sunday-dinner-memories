import Sidebar from './Sidebar'
import Navbar from './Navbar'
import MobileNav from './MobileNav'

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
