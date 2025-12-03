import { useState, useEffect } from 'react'
import axios from 'axios'

function Dashboard() {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuctions()
    const interval = setInterval(fetchAuctions, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  // Update countdown every second
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchAuctions = async () => {
    try {
      const response = await axios.get('/api/auctions')
      setAuctions(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching auctions:', error)
      setLoading(false)
    }
  }

  const calculateTimeRemaining = (endTime) => {
    const now = new Date()
    const end = new Date(endTime)
    const diff = end - now

    if (diff <= 0) return 'Expired'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-slate-400">Loading auctions...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Active Auctions</h2>
        <p className="text-slate-400">Live countdown timers for all active auctions</p>
      </div>

      {auctions.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <p className="text-slate-400 text-lg">No active auctions at the moment</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {auctions.map((auction) => (
            <div
              key={auction.id}
              className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <h3 className="text-xl font-semibold text-white mb-2">{auction.title}</h3>
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">{auction.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Starting Price:</span>
                  <span className="text-green-400 font-semibold">${parseFloat(auction.starting_price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bids:</span>
                  <span className="text-blue-400 font-semibold">{auction.bids_count}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Time Remaining:</span>
                  <span className="text-yellow-400 font-mono font-semibold text-sm">
                    {calculateTimeRemaining(auction.end_time)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard

