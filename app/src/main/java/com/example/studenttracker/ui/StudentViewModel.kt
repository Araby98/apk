package com.example.studenttracker.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.studenttracker.data.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.YearMonth

enum class ViewMode { CARDS, TABLE }
enum class StatusFilter { ALL, PAID, UNPAID }

data class DashboardUiState(
    val students: List<StudentWithPaymentStatus> = emptyList(),
    val filteredStudents: List<StudentWithPaymentStatus> = emptyList(),
    val currentMonth: String = YearMonth.now().toString(),
    val totalExpected: Double = 0.0,
    val totalCollected: Double = 0.0,
    val modules: List<Module> = emptyList(),
    val searchQuery: String = "",
    val statusFilter: StatusFilter = StatusFilter.ALL,
    val subjectFilter: String = "all",
    val viewMode: ViewMode = ViewMode.CARDS,
    val isArabic: Boolean = false,
    val totalStudentsCount: Int = 0,
    val paidStudentsCount: Int = 0,
    val unpaidStudentsCount: Int = 0
)

class StudentViewModel(
    private val studentDao: StudentDao,
    private val paymentDao: PaymentDao,
    private val moduleDao: ModuleDao
) : ViewModel() {

    private val _selectedMonth = MutableStateFlow(YearMonth.now().toString())
    private val _searchQuery = MutableStateFlow("")
    private val _statusFilter = MutableStateFlow(StatusFilter.ALL)
    private val _subjectFilter = MutableStateFlow("all")
    private val _viewMode = MutableStateFlow(ViewMode.CARDS)
    private val _isArabic = MutableStateFlow(false)

    init {
        seedInitialDataIfEmpty()
    }

    private fun seedInitialDataIfEmpty() {
        viewModelScope.launch {
            if (moduleDao.getModulesCount() == 0) {
                listOf("Mathematics", "Physics", "Chemistry", "Biology", "English", "History").forEach {
                    moduleDao.insertModule(Module(name = it))
                }
            }

            if (studentDao.getStudentsCount() == 0) {
                val s1 = Student(firstName = "Alex", lastName = "Rivera", phone = "(555) 234-5678", grade = "10th Grade", module = "Mathematics, Physics", monthlyPrice = 150.0)
                val s2 = Student(firstName = "Sarah", lastName = "Jenkins", phone = "(555) 876-5432", grade = "11th Grade", module = "Physics, Chemistry", monthlyPrice = 120.0)
                val s3 = Student(firstName = "Lucas", lastName = "Vance", phone = "(555) 345-6789", grade = "12th Grade", module = "Chemistry, Biology", monthlyPrice = 180.0)
                val s4 = Student(firstName = "Emily", lastName = "Chen", phone = "(555) 901-2345", grade = "Bachelor 1", module = "Mathematics", monthlyPrice = 140.0)

                studentDao.insertStudent(s1)
                studentDao.insertStudent(s2)
                studentDao.insertStudent(s3)
                studentDao.insertStudent(s4)

                val month = _selectedMonth.value
                paymentDao.recordPayment(Payment(studentId = s1.id, monthYear = month, amountPaid = 150.0, isPaid = true, paymentDate = System.currentTimeMillis()))
                paymentDao.recordPayment(Payment(studentId = s2.id, monthYear = month, amountPaid = 120.0, isPaid = true, paymentDate = System.currentTimeMillis()))
                paymentDao.recordPayment(Payment(studentId = s3.id, monthYear = month, amountPaid = 0.0, isPaid = false))
                paymentDao.recordPayment(Payment(studentId = s4.id, monthYear = month, amountPaid = 140.0, isPaid = true, paymentDate = System.currentTimeMillis()))
            }
        }
    }

    val modules: StateFlow<List<Module>> = moduleDao.getAllModules()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    val uiState: StateFlow<DashboardUiState> = combine(
        _selectedMonth,
        studentDao.getStudentsWithPaymentStatus(_selectedMonth.value),
        paymentDao.getTotalRevenueForMonth(_selectedMonth.value),
        moduleDao.getAllModules(),
        _searchQuery,
        _statusFilter,
        _subjectFilter,
        _viewMode,
        _isArabic
    ) { month, studentsWithStatus, collected, modulesList, query, statusF, subjectF, vMode, arabic ->
        val totalExp = studentsWithStatus.sumOf { it.student.monthlyPrice }
        val paidCount = studentsWithStatus.count { it.isPaidCurrentMonth == true }
        val unpaidCount = studentsWithStatus.size - paidCount

        val filtered = studentsWithStatus.filter { item ->
            // Search query filter
            val q = query.trim().lowercase()
            val matchesQuery = q.isEmpty() ||
                item.student.firstName.lowercase().contains(q) ||
                item.student.lastName.lowercase().contains(q) ||
                item.student.module.lowercase().contains(q) ||
                item.student.phone.lowercase().contains(q)

            // Status filter
            val isPaid = item.isPaidCurrentMonth == true
            val matchesStatus = when (statusF) {
                StatusFilter.ALL -> true
                StatusFilter.PAID -> isPaid
                StatusFilter.UNPAID -> !isPaid
            }

            // Subject filter
            val matchesSubject = if (subjectF == "all") true else {
                item.student.modulesList.any { it.equals(subjectF, ignoreCase = true) }
            }

            matchesQuery && matchesStatus && matchesSubject
        }

        DashboardUiState(
            students = studentsWithStatus,
            filteredStudents = filtered,
            currentMonth = month,
            totalExpected = totalExp,
            totalCollected = collected ?: 0.0,
            modules = modulesList,
            searchQuery = query,
            statusFilter = statusF,
            subjectFilter = subjectF,
            viewMode = vMode,
            isArabic = arabic,
            totalStudentsCount = studentsWithStatus.size,
            paidStudentsCount = paidCount,
            unpaidStudentsCount = unpaidCount
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = DashboardUiState()
    )

    // Month navigation
    fun nextMonth() {
        val current = YearMonth.parse(_selectedMonth.value)
        _selectedMonth.value = current.plusMonths(1).toString()
    }

    fun previousMonth() {
        val current = YearMonth.parse(_selectedMonth.value)
        _selectedMonth.value = current.minusMonths(1).toString()
    }

    // Filter and UI State Controls
    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setStatusFilter(filter: StatusFilter) {
        _statusFilter.value = filter
    }

    fun setSubjectFilter(subject: String) {
        _subjectFilter.value = subject
    }

    fun setViewMode(mode: ViewMode) {
        _viewMode.value = mode
    }

    fun toggleLanguage() {
        _isArabic.value = !_isArabic.value
    }

    // Student CRUD
    fun addStudent(
        firstName: String,
        lastName: String,
        phone: String,
        grade: String,
        modules: List<String>,
        price: Double
    ) {
        viewModelScope.launch {
            val student = Student(
                firstName = firstName.trim(),
                lastName = lastName.trim(),
                phone = phone.trim().ifEmpty { "N/A" },
                grade = grade.trim().ifEmpty { "General" },
                module = modules.joinToString(", ").ifEmpty { "General" },
                monthlyPrice = price
            )
            studentDao.insertStudent(student)
        }
    }

    fun updateStudent(
        id: String,
        firstName: String,
        lastName: String,
        phone: String,
        grade: String,
        modules: List<String>,
        price: Double
    ) {
        viewModelScope.launch {
            val student = Student(
                id = id,
                firstName = firstName.trim(),
                lastName = lastName.trim(),
                phone = phone.trim().ifEmpty { "N/A" },
                grade = grade.trim().ifEmpty { "General" },
                module = modules.joinToString(", ").ifEmpty { "General" },
                monthlyPrice = price
            )
            studentDao.updateStudent(student)
        }
    }

    fun deleteStudent(studentId: String) {
        viewModelScope.launch {
            studentDao.deleteStudent(studentId)
        }
    }

    fun togglePaymentStatus(studentId: String, monthlyPrice: Double, currentlyPaid: Boolean) {
        viewModelScope.launch {
            val month = _selectedMonth.value
            val payment = Payment(
                studentId = studentId,
                monthYear = month,
                amountPaid = if (!currentlyPaid) monthlyPrice else 0.0,
                isPaid = !currentlyPaid,
                paymentDate = if (!currentlyPaid) System.currentTimeMillis() else null
            )
            paymentDao.recordPayment(payment)
        }
    }

    // Module / Subject CRUD Operations
    fun addModule(name: String) {
        if (name.isBlank()) return
        viewModelScope.launch {
            moduleDao.insertModule(Module(name = name.trim()))
        }
    }

    fun updateModule(module: Module, newName: String) {
        val trimmed = newName.trim()
        if (trimmed.isBlank() || trimmed == module.name) return
        viewModelScope.launch {
            val oldName = module.name
            moduleDao.updateModule(module.copy(name = trimmed))
            if (_subjectFilter.value == oldName) {
                _subjectFilter.value = trimmed
            }
        }
    }

    fun deleteModule(moduleId: String, moduleName: String) {
        viewModelScope.launch {
            moduleDao.deleteModuleById(moduleId)
            if (_subjectFilter.value == moduleName) {
                _subjectFilter.value = "all"
            }
        }
    }
}

class StudentViewModelFactory(
    private val studentDao: StudentDao,
    private val paymentDao: PaymentDao,
    private val moduleDao: ModuleDao
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(StudentViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return StudentViewModel(studentDao, paymentDao, moduleDao) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
