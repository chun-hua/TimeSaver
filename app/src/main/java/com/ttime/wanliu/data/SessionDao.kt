package com.ttime.wanliu.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface SessionDao {
    @Insert
    suspend fun insert(session: Session): Long

    @Update
    suspend fun update(session: Session)

    @Query("SELECT * FROM sessions WHERE id = :id")
    suspend fun getById(id: Long): Session?

    @Query("SELECT * FROM sessions ORDER BY startTimeMillis DESC LIMIT :limit")
    fun getRecentSessions(limit: Int = 20): Flow<List<Session>>

    @Query("SELECT SUM(actualFocusSeconds) FROM sessions WHERE isCompleted = 1")
    suspend fun getTotalFocusSeconds(): Int

    @Query("SELECT COUNT(*) FROM sessions WHERE isCompleted = 1")
    suspend fun getCompletedCount(): Int

    @Query("UPDATE sessions SET actualFocusSeconds = :seconds, isCompleted = :completed WHERE id = :id")
    suspend fun finishSession(id: Long, seconds: Int, completed: Boolean)
}
