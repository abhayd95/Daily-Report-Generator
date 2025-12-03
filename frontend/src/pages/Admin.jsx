import { useState, useEffect } from 'react'
import axios from 'axios'

function Admin() {
  const [auctions, setAuctions] = useState([])
  const [cronLogs, setCronLogs] = useState([])
  const [backups, setBackups] = useState([])
  const [selectedBackup, setSelectedBackup] = useState(null)
  const [selectedBackupFilename, setSelectedBackupFilename] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupMessage, setBackupMessage] = useState(null)

  useEffect(() => {
    fetchData()
    fetchBackups()
    const interval = setInterval(fetchData, 5000) // Refresh every 5 seconds
    const backupInterval = setInterval(fetchBackups, 30000) // Refresh backups every 30 seconds
    return () => {
      clearInterval(interval)
      clearInterval(backupInterval)
    }
  }, [])

  const fetchData = async () => {
    try {
      const [auctionsRes, logsRes] = await Promise.all([
        axios.get('/api/auctions/all'),
        axios.get('/api/cron-logs')
      ])
      setAuctions(auctionsRes.data)
      setCronLogs(logsRes.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  const fetchBackups = async () => {
    try {
      const response = await axios.get('/api/backups')
      setBackups(response.data)
    } catch (error) {
      console.error('Error fetching backups:', error)
    }
  }

  const handleCreateBackup = async () => {
    setBackupLoading(true)
    setBackupMessage(null)
    try {
      const response = await axios.post('/api/backups/create')
      setBackupMessage({ type: 'success', text: `Backup created: ${response.data.filename}` })
      await fetchBackups()
      setTimeout(() => setBackupMessage(null), 5000)
    } catch (error) {
      console.error('Error creating backup:', error)
      setBackupMessage({ type: 'error', text: 'Failed to create backup' })
      setTimeout(() => setBackupMessage(null), 5000)
    } finally {
      setBackupLoading(false)
    }
  }

  const handleViewBackup = async (filename) => {
    try {
      const response = await axios.get(`/api/backups/${filename}`)
      setSelectedBackup(response.data)
      setSelectedBackupFilename(filename)
    } catch (error) {
      console.error('Error fetching backup details:', error)
      alert('Failed to load backup details')
    }
  }

  const handleDownloadBackup = (filename) => {
    window.open(`/api/backups/${filename}?download=true`, '_blank')
  }

  const handleDownloadPDF = (filename) => {
    window.open(`/api/backups/${filename}/pdf`, '_blank')
  }

  const formatFileSize = (sizeKB) => {
    if (sizeKB < 1024) return `${sizeKB} KB`
    return `${(sizeKB / 1024).toFixed(2)} MB`
  }

  const handleCleanup = async () => {
    setCleanupLoading(true)
    try {
      await axios.post('/api/cleanup')
      await fetchData()
      alert('Cleanup completed successfully!')
    } catch (error) {
      console.error('Error cleaning up:', error)
      alert('Error performing cleanup')
    } finally {
      setCleanupLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this auction?')) return
    
    try {
      await axios.delete(`/api/auctions/${id}`)
      await fetchData()
    } catch (error) {
      console.error('Error deleting auction:', error)
      alert('Error deleting auction')
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      success: 'bg-green-500/20 text-green-400',
      error: 'bg-red-500/20 text-red-400',
      running: 'bg-blue-500/20 text-blue-400'
    }
    return colors[status] || 'bg-slate-500/20 text-slate-400'
  }

  const isExpired = (endTime) => {
    return new Date(endTime) < new Date()
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Admin Panel</h2>
        <p className="text-slate-400">Manage all auctions and monitor cron jobs</p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <button
          onClick={handleCleanup}
          disabled={cleanupLoading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          {cleanupLoading ? 'Cleaning up...' : '🧹 Manual Cleanup (Delete Expired)'}
        </button>
        <button
          onClick={handleCreateBackup}
          disabled={backupLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          {backupLoading ? 'Creating backup...' : '💾 Create Backup Now'}
        </button>
      </div>

      {/* Backup Message */}
      {backupMessage && (
        <div className={`mb-4 p-4 rounded-lg ${
          backupMessage.type === 'success' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {backupMessage.text}
        </div>
      )}

      {/* Cron Status Indicator */}
      <div className="mb-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">🕐 Cron Job Status</h3>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="bg-slate-700/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-1">Cleanup Job</div>
            <div className="text-green-400 font-semibold">✅ Running (Every 30 mins)</div>
          </div>
          <div className="bg-slate-700/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-1">Hourly Report</div>
            <div className="text-green-400 font-semibold">✅ Running (Every hour)</div>
          </div>
          <div className="bg-slate-700/50 rounded p-4">
            <div className="text-sm text-slate-400 mb-1">Daily Backup</div>
            <div className="text-green-400 font-semibold">✅ Running (2:00 AM)</div>
          </div>
        </div>

        {/* Recent Cron Logs */}
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-white mb-3">Recent Cron Logs</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {cronLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="bg-slate-700/30 rounded p-3 flex justify-between items-center text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(log.status)}`}>
                    {log.status}
                  </span>
                  <span className="text-slate-300 font-mono">{log.job_name}</span>
                </div>
                <div className="text-slate-400 text-xs">
                  {new Date(log.executed_at).toLocaleString()}
                </div>
              </div>
            ))}
            {cronLogs.length === 0 && (
              <div className="text-slate-400 text-sm text-center py-4">No cron logs yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Backup Viewer Section */}
      <div className="mb-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">💾 Backup Files ({backups.length})</h3>
        </div>
        
        {backups.length === 0 ? (
          <div className="text-slate-400 text-center py-8">No backups found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">File Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Auctions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {backups.map((backup) => (
                  <tr key={backup.filename} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-sm text-slate-300 font-mono text-xs">{backup.filename}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {new Date(backup.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{formatFileSize(backup.sizeKB)}</td>
                    <td className="px-4 py-3 text-sm text-blue-400">{backup.totalAuctions}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        backup.backupType === 'manual' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {backup.backupType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewBackup(backup.filename)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadBackup(backup.filename)}
                          className="text-green-400 hover:text-green-300 transition-colors"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(backup.filename)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Backup Details Modal */}
      {selectedBackup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-2xl font-semibold text-white">Backup Details</h3>
              <button
                onClick={() => setSelectedBackup(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded p-3">
                  <div className="text-xs text-slate-400 mb-1">Timestamp</div>
                  <div className="text-sm text-white">{new Date(selectedBackup.timestamp).toLocaleString()}</div>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <div className="text-xs text-slate-400 mb-1">Type</div>
                  <div className="text-sm text-white">{selectedBackup.backupType || 'automatic'}</div>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <div className="text-xs text-slate-400 mb-1">Auctions</div>
                  <div className="text-sm text-blue-400">{selectedBackup.totalAuctions || 0}</div>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <div className="text-xs text-slate-400 mb-1">Cron Logs</div>
                  <div className="text-sm text-purple-400">{selectedBackup.totalCronLogs || 0}</div>
                </div>
              </div>

              {/* Auctions Table */}
              {selectedBackup.auctions && selectedBackup.auctions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Auctions ({selectedBackup.auctions.length})</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs text-slate-300">ID</th>
                          <th className="px-3 py-2 text-left text-xs text-slate-300">Title</th>
                          <th className="px-3 py-2 text-left text-xs text-slate-300">Price</th>
                          <th className="px-3 py-2 text-left text-xs text-slate-300">Bids</th>
                          <th className="px-3 py-2 text-left text-xs text-slate-300">End Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {selectedBackup.auctions.map((auction) => (
                          <tr key={auction.id} className="hover:bg-slate-700/30">
                            <td className="px-3 py-2 text-slate-300">{auction.id}</td>
                            <td className="px-3 py-2 text-white">{auction.title}</td>
                            <td className="px-3 py-2 text-green-400">${parseFloat(auction.starting_price).toFixed(2)}</td>
                            <td className="px-3 py-2 text-blue-400">{auction.bids_count}</td>
                            <td className="px-3 py-2 text-slate-300">{new Date(auction.end_time).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Cron Logs */}
              {selectedBackup.cronLogs && selectedBackup.cronLogs.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Cron Logs ({selectedBackup.cronLogs.length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedBackup.cronLogs.map((log, index) => (
                      <div
                        key={index}
                        className="bg-slate-700/30 rounded p-3 text-sm"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            log.status === 'success' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {log.status}
                          </span>
                          <span className="text-slate-400 text-xs">
                            {new Date(log.executed_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-slate-300 font-mono text-xs mb-1">{log.job_name}</div>
                        {log.message && (
                          <div className="text-slate-400 text-xs">{log.message}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              {selectedBackupFilename && (
                <>
                  <button
                    onClick={() => handleDownloadPDF(selectedBackupFilename)}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                  >
                    Download as PDF
                  </button>
                  <button
                    onClick={() => handleDownloadBackup(selectedBackupFilename)}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                  >
                    Download JSON
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setSelectedBackup(null)
                  setSelectedBackupFilename(null)
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Auctions Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-xl font-semibold text-white">All Auctions ({auctions.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Bids</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">End Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {auctions.map((auction) => (
                <tr key={auction.id} className="hover:bg-slate-700/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{auction.id}</td>
                  <td className="px-6 py-4 text-sm text-white">{auction.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">
                    ${parseFloat(auction.starting_price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400">{auction.bids_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {new Date(auction.end_time).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isExpired(auction.end_time) ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-red-500/20 text-red-400">
                        Expired
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-green-500/20 text-green-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDelete(auction.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {auctions.length === 0 && (
            <div className="text-center py-8 text-slate-400">No auctions found</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Admin

