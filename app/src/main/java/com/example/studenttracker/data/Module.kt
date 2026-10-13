package com.example.studenttracker.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(tableName = "modules")
data class Module(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String
)
