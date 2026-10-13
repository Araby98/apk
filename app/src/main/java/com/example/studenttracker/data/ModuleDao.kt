package com.example.studenttracker.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface ModuleDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertModule(module: Module)

    @Update
    suspend fun updateModule(module: Module)

    @Delete
    suspend fun deleteModule(module: Module)

    @Query("DELETE FROM modules WHERE id = :moduleId")
    suspend fun deleteModuleById(moduleId: String)

    @Query("SELECT * FROM modules ORDER BY name ASC")
    fun getAllModules(): Flow<List<Module>>

    @Query("SELECT COUNT(*) FROM modules")
    suspend fun getModulesCount(): Int
}
