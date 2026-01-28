// src/components/Checkin/CheckinHistory.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export const CheckinHistory = () => {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [timeRange, setTimeRange] = useState('3-months'); // '1-month', '3-months', '6-months', 'all'

  useEffect(() => {
    if (user) {
      fetchCheckins();
    }
  }, [user, timeRange]);

  const fetchCheckins = async () => {
    setLoading(true);

    let query = supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply time filter
    if (timeRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case '1-month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case '3-months':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case '6-months':
          startDate = new Date(now.setMonth(now.getMonth() - 6));
          break;
      }
      
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching check-ins:', error);
    } else {
      setCheckins(data || []);
    }

    setLoading(false);
  };

  // Calculate averages
  const calculateStats = () => {
    if (checkins.length === 0) return null;

    const avgMood = checkins.reduce((sum, c) => sum + c.mood_rating, 0) / checkins.length;
    const avgEnergy = checkins.reduce((sum, c) => sum + c.energy_level, 0) / checkins.length;

    // Mood trend (comparing first half to second half)
    const midpoint = Math.floor(checkins.length / 2);
    const recentAvg = checkins.slice(0, midpoint).reduce((sum, c) => sum + c.mood_rating, 0) / midpoint || avgMood;
    const olderAvg = checkins.slice(midpoint).reduce((sum, c) => sum + c.mood_rating, 0) / (checkins.length - midpoint) || avgMood;
    const moodTrend = recentAvg - olderAvg;

    return {
      avgMood: avgMood.toFixed(1),
      avgEnergy: avgEnergy.toFixed(1),
      totalCheckins: checkins.length,
      moodTrend: moodTrend > 0 ? 'up' : moodTrend < 0 ? 'down' : 'stable',
      moodChange: Math.abs(moodTrend).toFixed(1)
    };
  };

  const stats = calculateStats();

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get mood emoji
  const getMoodEmoji = (rating) => {
    if (rating >= 8) return '😊';
    if (rating >= 6) return '🙂';
    if (rating >= 4) return '😐';
    if (rating >= 2) return '😔';
    return '😢';
  };

  if (loading) {
    return <div className="loading">Loading your check-ins...</div>;
  }

  return (
    <div className="checkin-history">
      <div className="history-header">
        <h2>Your Progress</h2>
        
        <div className="time-filter">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="1-month">Last Month</option>
            <option value="3-months">Last 3 Months</option>
            <option value="6-months">Last 6 Months</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-value">{stats.avgMood}</div>
            <div className="stat-label">Avg Mood</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.avgEnergy}</div>
            <div className="stat-label">Avg Energy</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalCheckins}</div>
            <div className="stat-label">Check-ins</div>
          </div>
          <div className="stat-card trend">
            <div className="stat-value">
              {stats.moodTrend === 'up' && '↑'}
              {stats.moodTrend === 'down' && '↓'}
              {stats.moodTrend === 'stable' && '→'}
              {stats.moodChange}
            </div>
            <div className="stat-label">Mood Trend</div>
          </div>
        </div>
      )}

      {/* Mood Chart (Simple visual) */}
      {checkins.length > 1 && (
        <div className="mood-chart">
          <h3>Mood Over Time</h3>
          <div className="chart-container">
            {checkins.slice().reverse().map((checkin, index) => (
              <div 
                key={checkin.id}
                className="chart-bar"
                style={{ height: `${checkin.mood_rating * 10}%` }}
                title={`${formatDate(checkin.created_at)}: ${checkin.mood_rating}/10`}
                onClick={() => setSelectedCheckin(checkin)}
              >
                <span className="bar-emoji">{getMoodEmoji(checkin.mood_rating)}</span>
              </div>
            ))}
          </div>
          <div className="chart-labels">
            <span>Older</span>
            <span>Recent</span>
          </div>
        </div>
      )}

      {/* Check-in List */}
      <div className="checkin-list">
        <h3>Check-in History</h3>
        
        {checkins.length === 0 ? (
          <div className="empty-state">
            <p>No check-ins yet for this time period.</p>
            <button 
              className="btn-primary"
              onClick={() => window.location.href = '/checkin'}
            >
              Start Your First Check-in
            </button>
          </div>
        ) : (
          <div className="checkins">
            {checkins.map(checkin => (
              <div 
                key={checkin.id}
                className={`checkin-card ${selectedCheckin?.id === checkin.id ? 'selected' : ''}`}
                onClick={() => setSelectedCheckin(selectedCheckin?.id === checkin.id ? null : checkin)}
              >
                <div className="checkin-summary">
                  <div className="checkin-date">{formatDate(checkin.created_at)}</div>
                  <div className="checkin-ratings">
                    <span className="mood">
                      {getMoodEmoji(checkin.mood_rating)} {checkin.mood_rating}
                    </span>
                    <span className="energy">
                      ⚡ {checkin.energy_level}
                    </span>
                  </div>
                </div>

                {selectedCheckin?.id === checkin.id && (
                  <div className="checkin-details">
                    {checkin.wins && (
                      <div className="detail-section">
                        <h4>Wins</h4>
                        <p>{checkin.wins}</p>
                      </div>
                    )}
                    {checkin.challenges && (
                      <div className="detail-section">
                        <h4>Challenges</h4>
                        <p>{checkin.challenges}</p>
                      </div>
                    )}
                    {checkin.gratitude && (
                      <div className="detail-section">
                        <h4>Gratitude</h4>
                        <p>{checkin.gratitude}</p>
                      </div>
                    )}
                    {checkin.focus_next_week && (
                      <div className="detail-section">
                        <h4>Focus for Next Week</h4>
                        <p>{checkin.focus_next_week}</p>
                      </div>
                    )}
                    {checkin.ai_reflection && (
                      <div className="detail-section reflection">
                        <h4>AI Reflection</h4>
                        <p>{checkin.ai_reflection}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckinHistory;
