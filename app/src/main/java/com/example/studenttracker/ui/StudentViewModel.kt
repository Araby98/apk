package com.example.studenttracker.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.studenttracker.data.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.YearMonth

data class DashboardUiState(
    val students: List<StudentWithPaymentStatus> = emptyList(),
    val currentMonth: String = YearMonth.now().toString(),
    val totalExpected: Double = 0.0,
    val totalCollected: Double = 0.0,
    val modules: List<Module> = emptyList()
)

class StudentViewModel(
    private val studentDao: StudentDao,
    private val paymentDao: PaymentDao,
    private val moduleDao: ModuleDao
) : ViewModel() {

    private val _selectedMonth = MutableStateFlow(YearMonth.now().toString())

    val modules: StateFlow<List<Module>> = moduleDao.getAllModules()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubsubscribed(5000),
            initialValue = emptyList()
        )

    val uiState: StateFlow<DashboardUiState> = combine(
        _selectedMonth,
        studentDao.getStudentsWithPaymentStatus(_selectedMonth.value),
        paymentDao.getTotalRevenueForMonth(_selectedMonth.value),
        moduleDao.getAllModules()
    ) { month, studentsWithStatus, collected, modulesList ->
        val expected = studentsWithStatus.sumOf { it.student.monthlyPrice }
        DashboardUiState(
            students = studentsWithStatus,
            currentMonth = month,
            totalExpected = expected,
            totalCollected = collected ?: 0.0,
            modules = modulesList
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubsubscribed(5000),
        initialValue = DashboardUiState()
    )

    fun addStudent(
        firstName: String,
        lastName: String,
        phone: String,
        grade: String,
        module: String,
        price: Double
    ) {
        viewModelScope.launch {
            val student = Student(
                firstName = firstName.trim(),
                lastName = lastName.trim(),
                phone = phone.trim(),
                grade = grade.trim(),
                module = module.trim(),
                monthlyPrice = price
            )
            studentDao.insertStudent(student)
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

    // --- Module / Subject CRUD Operations ---

    fun addModule(name: String) {
        if (name.isBlank()) return
        viewModelScope.launch {
            moduleDao.insertModule(Module(name = name.trim()))
        }
    }

    fun updateModule(module: Module, newName: String) {
        if (newName.isBlank()) return
        viewModelScope.launch {
            moduleDao.updateModule(module.copy(name = newName.trim()))
        }
    }

    fun deleteModule(moduleId: String) {
        viewModelScope.launch {
            moduleDao.deleteModuleById(moduleId)
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
