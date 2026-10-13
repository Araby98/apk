package com.example.studenttracker.ui

import android.content.Context
import android.content.Intent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.studenttracker.data.Module
import com.example.studenttracker.data.Student
import com.example.studenttracker.data.StudentWithPaymentStatus

// Color Palette matching the preview
private val PrimaryPurple = Color(0xFF6750A4)
private val PrimaryPurpleContainer = Color(0xFFEADDFF)
private val OnPrimaryPurpleContainer = Color(0xFF21005D)
private val PaidGreen = Color(0xFF2E7D32)
private val PaidGreenBg = Color(0xFFE8F5E9)
private val UnpaidRed = Color(0xFFC62828)
private val UnpaidRedBg = Color(0xFFFFEBEE)
private val ChipBg = Color(0xFFEDE7F6)
private val ChipText = Color(0xFF512DA8)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentTrackerDashboard(viewModel: StudentViewModel) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    var showAddDialog by remember { mutableStateOf(false) }
    var editingStudent by remember { mutableStateOf<Student?>(null) }
    var showManageModulesDialog by remember { mutableStateOf(false) }

    // Translations Dictionary
    val isAr = state.isArabic
    val t = object {
        val appTitle = if (isAr) "متتبع الطلاب" else "Student Tracker"
        val selectedMonth = if (isAr) "الشهر المحدد" else "Selected Month"
        val collectedTarget = if (isAr) "المُحصَّل / المستهدف" else "Collected / Target"
        val totalStudents = if (isAr) "إجمالي الطلاب" else "Total Students"
        val paidYes = if (isAr) "مدفوع (نعم)" else "Paid (Yes)"
        val unpaidNo = if (isAr) "غير مدفوع (لا)" else "Unpaid (No)"
        val cardsView = if (isAr) "عرض البطاقات" else "Cards View"
        val tableView = if (isAr) "عرض الجدول" else "Table View"
        val searchHint = if (isAr) "ابحث عن طالب أو مادة..." else "Search student or subject..."
        val all = if (isAr) "الكل" else "All"
        val paid = if (isAr) "مدفوع: نعم" else "Paid: Yes"
        val unpaid = if (isAr) "غير مدفوع: لا" else "Unpaid: No"
        val allSubjects = if (isAr) "كل المواد" else "All Subjects"
        val manageSubjects = if (isAr) "المواد" else "Subjects"
        val addStudent = if (isAr) "إضافة طالب" else "Add Student"
        val editStudent = if (isAr) "تعديل طالب" else "Edit Student"
        val firstName = if (isAr) "الاسم الأول" else "First Name"
        val lastName = if (isAr) "اسم العائلة" else "Last Name"
        val phone = if (isAr) "رقم الهاتف" else "Phone Number"
        val grade = if (isAr) "المستوى / الفصل" else "Grade / Level"
        val price = if (isAr) "السعر الشهري ($)" else "Monthly Price ($)"
        val subjects = if (isAr) "المواد الدراسية" else "Subjects"
        val save = if (isAr) "حفظ" else "Save"
        val cancel = if (isAr) "إلغاء" else "Cancel"
        val export = if (isAr) "تصدير" else "Export"
        val swipeHint = if (isAr) "اسحب لليسار للحذف • اضغط ✏️ للتعديل" else "Swipe left to delete • Tap ✏️ to edit"
        val noStudents = if (isAr) "لا يوجد طلاب يطابقون الفلاتر المختارة" else "No students match the selected filters"
    }

    CompositionLocalProvider(
        LocalLayoutDirection provides if (isAr) LayoutDirection.Rtl else LayoutDirection.Ltr
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.School,
                                contentDescription = null,
                                tint = PrimaryPurple,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = t.appTitle,
                                fontWeight = FontWeight.Bold,
                                fontSize = 19.sp
                            )
                        }
                    },
                    actions = {
                        // Language Switcher Badge
                        FilledTonalButton(
                            onClick = { viewModel.toggleLanguage() },
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            modifier = Modifier.height(34.dp)
                        ) {
                            Text(
                                text = if (isAr) "EN" else "العربية",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        }

                        Spacer(modifier = Modifier.width(4.dp))

                        // Export Icon
                        IconButton(onClick = { exportStudentsToCsv(context, state) }) {
                            Icon(Icons.Default.Share, contentDescription = t.export, tint = PrimaryPurple)
                        }

                        // Manage Modules Icon
                        IconButton(onClick = { showManageModulesDialog = true }) {
                            Icon(Icons.Default.MenuBook, contentDescription = t.manageSubjects, tint = PrimaryPurple)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
                )
            },
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { showAddDialog = true },
                    containerColor = PrimaryPurple,
                    contentColor = Color.White
                ) {
                    Icon(Icons.Default.Add, contentDescription = t.addStudent)
                }
            }
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .padding(innerPadding)
                    .fillMaxSize()
                    .padding(horizontal = 14.dp, vertical = 6.dp)
            ) {
                // Month Navigation Header
                Row(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { viewModel.previousMonth() }) {
                        Icon(Icons.Default.ChevronLeft, contentDescription = "Prev")
                    }
                    Card(
                        colors = CardDefaults.cardColors(containerColor = PrimaryPurpleContainer),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Text(
                            text = state.currentMonth,
                            fontWeight = FontWeight.Bold,
                            color = OnPrimaryPurpleContainer,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                        )
                    }
                    IconButton(onClick = { viewModel.nextMonth() }) {
                        Icon(Icons.Default.ChevronRight, contentDescription = "Next")
                    }
                }

                // Stats Banner Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = PrimaryPurpleContainer)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(t.selectedMonth, style = MaterialTheme.typography.labelSmall, color = OnPrimaryPurpleContainer.copy(alpha = 0.7f))
                                Text(state.currentMonth, fontWeight = FontWeight.Bold, color = OnPrimaryPurpleContainer)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(t.collectedTarget, style = MaterialTheme.typography.labelSmall, color = OnPrimaryPurpleContainer.copy(alpha = 0.7f))
                                Text("$${state.totalCollected} / $${state.totalExpected}", fontWeight = FontWeight.Bold, color = OnPrimaryPurpleContainer)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Progress Bar
                        val progress = if (state.totalExpected > 0) (state.totalCollected / state.totalExpected).toFloat().coerceIn(0f, 1f) else 0f
                        LinearProgressIndicator(
                            progress = progress,
                            modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                            color = PrimaryPurple,
                            trackColor = Color.White.copy(alpha = 0.5f)
                        )

                        Spacer(modifier = Modifier.height(6.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${(progress * 100).toInt()}% collected", fontSize = 11.sp, color = OnPrimaryPurpleContainer)
                            Text("${state.unpaidStudentsCount} unpaid", fontSize = 11.sp, color = OnPrimaryPurpleContainer)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Summary Counters Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    SummaryStatBox(
                        title = t.totalStudents,
                        count = state.totalStudentsCount.toString(),
                        color = PrimaryPurple,
                        modifier = Modifier.weight(1f)
                    )
                    SummaryStatBox(
                        title = t.paidYes,
                        count = state.paidStudentsCount.toString(),
                        color = PaidGreen,
                        modifier = Modifier.weight(1f)
                    )
                    SummaryStatBox(
                        title = t.unpaidNo,
                        count = state.unpaidStudentsCount.toString(),
                        color = UnpaidRed,
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                // View Switcher (Cards vs Table)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                        .padding(3.dp)
                ) {
                    val isCards = state.viewMode == ViewMode.CARDS
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isCards) PrimaryPurple else Color.Transparent)
                            .clickable { viewModel.setViewMode(ViewMode.CARDS) }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.ViewAgenda, contentDescription = null, tint = if (isCards) Color.White else MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(t.cardsView, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (isCards) Color.White else MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (!isCards) PrimaryPurple else Color.Transparent)
                            .clickable { viewModel.setViewMode(ViewMode.TABLE) }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.TableChart, contentDescription = null, tint = if (!isCards) Color.White else MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(t.tableView, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (!isCards) Color.White else MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Search Bar
                OutlinedTextField(
                    value = state.searchQuery,
                    onValueChange = { viewModel.setSearchQuery(it) },
                    placeholder = { Text(t.searchHint, fontSize = 13.sp) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(18.dp)) },
                    trailingIcon = {
                        if (state.searchQuery.isNotEmpty()) {
                            IconButton(onClick = { viewModel.setSearchQuery("") }) {
                                Icon(Icons.Default.Close, contentDescription = "Clear", modifier = Modifier.size(16.dp))
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().height(50.dp)
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Status Filter Tabs
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    FilterTabButton(
                        label = "${t.all} (${state.totalStudentsCount})",
                        selected = state.statusFilter == StatusFilter.ALL,
                        onClick = { viewModel.setStatusFilter(StatusFilter.ALL) },
                        modifier = Modifier.weight(1f)
                    )
                    FilterTabButton(
                        label = "${t.paid} (${state.paidStudentsCount})",
                        selected = state.statusFilter == StatusFilter.PAID,
                        onClick = { viewModel.setStatusFilter(StatusFilter.PAID) },
                        modifier = Modifier.weight(1f)
                    )
                    FilterTabButton(
                        label = "${t.unpaid} (${state.unpaidStudentsCount})",
                        selected = state.statusFilter == StatusFilter.UNPAID,
                        onClick = { viewModel.setStatusFilter(StatusFilter.UNPAID) },
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Custom Subject Filter Dropdown
                SubjectFilterDropdown(
                    selectedSubject = state.subjectFilter,
                    allLabel = t.allSubjects,
                    modules = state.modules,
                    onSubjectSelected = { viewModel.setSubjectFilter(it) }
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Content View (Cards vs Table)
                if (state.filteredStudents.isEmpty()) {
                    Box(
                        modifier = Modifier.fillMaxWidth().weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = t.noStudents,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center
                        )
                    }
                } else if (state.viewMode == ViewMode.CARDS) {
                    // Swipe Hint
                    Text(
                        text = t.swipeHint,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )

                    LazyColumn(
                        modifier = Modifier.fillMaxWidth().weight(1f),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(state.filteredStudents, key = { it.student.id }) { item ->
                            SwipeableStudentCard(
                                item = item,
                                onTogglePayment = {
                                    viewModel.togglePaymentStatus(
                                        studentId = item.student.id,
                                        monthlyPrice = item.student.monthlyPrice,
                                        currentlyPaid = item.isPaidCurrentMonth == true
                                    )
                                },
                                onEdit = { editingStudent = item.student },
                                onDelete = { viewModel.deleteStudent(item.student.id) }
                            )
                        }
                    }
                } else {
                    // Table View
                    MonthlyTableView(
                        students = state.filteredStudents,
                        month = state.currentMonth,
                        onTogglePayment = { student ->
                            val isPaid = state.filteredStudents.find { it.student.id == student.id }?.isPaidCurrentMonth == true
                            viewModel.togglePaymentStatus(student.id, student.monthlyPrice, isPaid)
                        },
                        onEdit = { editingStudent = it },
                        onDelete = { viewModel.deleteStudent(it.id) },
                        modifier = Modifier.fillMaxWidth().weight(1f)
                    )
                }
            }
        }

        // Add Student Dialog
        if (showAddDialog) {
            AddOrEditStudentDialog(
                title = t.addStudent,
                modules = state.modules,
                initialStudent = null,
                onDismiss = { showAddDialog = false },
                onManageModules = {
                    showAddDialog = false
                    showManageModulesDialog = true
                },
                onConfirm = { fn, ln, phone, grade, selectedMods, price ->
                    viewModel.addStudent(fn, ln, phone, grade, selectedMods, price)
                    showAddDialog = false
                }
            )
        }

        // Edit Student Dialog
        editingStudent?.let { student ->
            AddOrEditStudentDialog(
                title = t.editStudent,
                modules = state.modules,
                initialStudent = student,
                onDismiss = { editingStudent = null },
                onManageModules = {
                    editingStudent = null
                    showManageModulesDialog = true
                },
                onConfirm = { fn, ln, phone, grade, selectedMods, price ->
                    viewModel.updateStudent(student.id, fn, ln, phone, grade, selectedMods, price)
                    editingStudent = null
                }
            )
        }

        // Manage Modules Dialog
        if (showManageModulesDialog) {
            ManageModulesDialog(
                modules = state.modules,
                onDismiss = { showManageModulesDialog = false },
                onAddModule = { viewModel.addModule(it) },
                onUpdateModule = { mod, newName -> viewModel.updateModule(mod, newName) },
                onDeleteModule = { id, name -> viewModel.deleteModule(id, name) }
            )
        }
    }
}

@Composable
fun SummaryStatBox(
    title: String,
    count: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f))
    ) {
        Column(
            modifier = Modifier.padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(title, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = color, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Spacer(modifier = Modifier.height(2.dp))
            Text(count, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = color)
        }
    }
}

@Composable
fun FilterTabButton(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(if (selected) PrimaryPurpleContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
            .clickable(onClick = onClick)
            .padding(vertical = 6.dp, horizontal = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
            color = if (selected) OnPrimaryPurpleContainer else MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubjectFilterDropdown(
    selectedSubject: String,
    allLabel: String,
    modules: List<Module>,
    onSubjectSelected: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val displayLabel = if (selectedSubject == "all") allLabel else selectedSubject

    Box(modifier = Modifier.fillMaxWidth()) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { expanded = !expanded },
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = CardDefaults.outlinedCardBorder()
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                    Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(PrimaryPurple))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = displayLabel,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                Icon(
                    imageVector = if (expanded) Icons.Default.ArrowDropUp else Icons.Default.ArrowDropDown,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            modifier = Modifier.fillMaxWidth(0.9f)
        ) {
            DropdownMenuItem(
                text = { Text(allLabel, fontWeight = if (selectedSubject == "all") FontWeight.Bold else FontWeight.Normal) },
                leadingIcon = {
                    Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(Color.Gray))
                },
                trailingIcon = {
                    if (selectedSubject == "all") Icon(Icons.Default.Check, contentDescription = null, tint = PrimaryPurple)
                },
                onClick = {
                    onSubjectSelected("all")
                    expanded = false
                }
            )

            modules.forEach { mod ->
                DropdownMenuItem(
                    text = { Text(mod.name, fontWeight = if (selectedSubject == mod.name) FontWeight.Bold else FontWeight.Normal) },
                    leadingIcon = {
                        Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(PrimaryPurple))
                    },
                    trailingIcon = {
                        if (selectedSubject == mod.name) Icon(Icons.Default.Check, contentDescription = null, tint = PrimaryPurple)
                    },
                    onClick = {
                        onSubjectSelected(mod.name)
                        expanded = false
                    }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SwipeableStudentCard(
    item: StudentWithPaymentStatus,
    onTogglePayment: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val isPaid = item.isPaidCurrentMonth == true
    val dismissState = rememberDismissState(
        confirmValueChange = { value ->
            if (value == DismissValue.DismissedToStart) {
                onDelete()
                true
            } else false
        }
    )

    SwipeToDismiss(
        state = dismissState,
        directions = setOf(DismissDirection.EndToStart),
        background = {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color(0xFFE53935))
                    .padding(horizontal = 20.dp),
                contentAlignment = Alignment.CenterEnd
            ) {
                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color.White)
            }
        },
        dismissContent = {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = CardDefaults.outlinedCardBorder()
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "${item.student.firstName} ${item.student.lastName}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            IconButton(onClick = onEdit, modifier = Modifier.size(24.dp)) {
                                Icon(Icons.Default.Edit, contentDescription = "Edit", tint = PrimaryPurple, modifier = Modifier.size(15.dp))
                            }
                        }

                        Text(
                            text = "${item.student.grade} • ${item.student.phone}",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        // Subject chips
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            items(item.student.modulesList) { modName ->
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(ChipBg)
                                        .padding(horizontal = 7.dp, vertical = 2.dp)
                                ) {
                                    Text(modName, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = ChipText)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "$${item.student.monthlyPrice}/mo",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryPurple
                        )
                    }

                    // Paid / Unpaid Button
                    FilledTonalButton(
                        onClick = onTogglePayment,
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = if (isPaid) PaidGreen else UnpaidRed,
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(20.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = if (isPaid) "Yes" else "No",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    )
}

@Composable
fun MonthlyTableView(
    students: List<StudentWithPaymentStatus>,
    month: String,
    onTogglePayment: (Student) -> Unit,
    onEdit: (Student) -> Unit,
    onDelete: (Student) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = CardDefaults.outlinedCardBorder()
    ) {
        Column(modifier = Modifier.fillMaxSize().padding(8.dp)) {
            // Table Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PrimaryPurpleContainer.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 8.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Name", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.weight(1.2f))
                Text("Subject(s)", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.weight(1.4f))
                Text("Paid (Yes/No)", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                Text("Actions", fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.weight(0.8f), textAlign = TextAlign.End)
            }

            Divider(modifier = Modifier.padding(vertical = 4.dp))

            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(students, key = { it.student.id }) { item ->
                    val isPaid = item.isPaidCurrentMonth == true
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1.2f)) {
                            Text("${item.student.firstName} ${item.student.lastName}", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Text(item.student.grade, fontSize = 10.sp, color = Color.Gray)
                        }

                        Text(
                            text = item.student.module,
                            fontSize = 11.sp,
                            modifier = Modifier.weight(1.4f),
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clickable { onTogglePayment(item.student) },
                            contentAlignment = Alignment.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isPaid) PaidGreenBg else UnpaidRedBg)
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    text = if (isPaid) "Yes" else "No",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isPaid) PaidGreen else UnpaidRed
                                )
                            }
                        }

                        Row(modifier = Modifier.weight(0.8f), horizontalArrangement = Arrangement.End) {
                            IconButton(onClick = { onEdit(item.student) }, modifier = Modifier.size(28.dp)) {
                                Icon(Icons.Default.Edit, contentDescription = "Edit", tint = PrimaryPurple, modifier = Modifier.size(15.dp))
                            }
                            IconButton(onClick = { onDelete(item.student) }, modifier = Modifier.size(28.dp)) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = UnpaidRed, modifier = Modifier.size(15.dp))
                            }
                        }
                    }
                    Divider(color = Color.LightGray.copy(alpha = 0.3f))
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddOrEditStudentDialog(
    title: String,
    modules: List<Module>,
    initialStudent: Student?,
    onDismiss: () -> Unit,
    onManageModules: () -> Unit,
    onConfirm: (String, String, String, String, List<String>, Double) -> Unit
) {
    var firstName by remember { mutableStateOf(initialStudent?.firstName ?: "") }
    var lastName by remember { mutableStateOf(initialStudent?.lastName ?: "") }
    var phone by remember { mutableStateOf(initialStudent?.phone ?: "") }
    var grade by remember { mutableStateOf(initialStudent?.grade ?: "") }
    var price by remember { mutableStateOf(initialStudent?.monthlyPrice?.toString() ?: "120.0") }
    var selectedModules by remember {
        mutableStateOf(initialStudent?.modulesList ?: if (modules.isNotEmpty()) listOf(modules.first().name) else listOf("Mathematics"))
    }
    var isSubjectMenuOpen by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth().heightIn(max = 420.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = firstName,
                    onValueChange = { firstName = it },
                    label = { Text("First Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = lastName,
                    onValueChange = { lastName = it },
                    label = { Text("Last Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone Number") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = grade,
                    onValueChange = { grade = it },
                    label = { Text("Grade / Level") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                // Multi-select Subjects Picker
                Text("Select Subjects:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                Box(modifier = Modifier.fillMaxWidth()) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { isSubjectMenuOpen = !isSubjectMenuOpen },
                        shape = RoundedCornerShape(10.dp),
                        border = CardDefaults.outlinedCardBorder()
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            if (selectedModules.isEmpty()) {
                                Text("Select subjects...", color = Color.Gray, fontSize = 12.sp)
                            } else {
                                LazyRow(
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    items(selectedModules) { mod ->
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(PrimaryPurpleContainer)
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(mod, fontSize = 11.sp, color = OnPrimaryPurpleContainer, fontWeight = FontWeight.SemiBold)
                                        }
                                    }
                                }
                            }
                            Icon(
                                imageVector = if (isSubjectMenuOpen) Icons.Default.ArrowDropUp else Icons.Default.ArrowDropDown,
                                contentDescription = null
                            )
                        }
                    }

                    DropdownMenu(
                        expanded = isSubjectMenuOpen,
                        onDismissRequest = { isSubjectMenuOpen = false }
                    ) {
                        modules.forEach { mod ->
                            val isChecked = selectedModules.contains(mod.name)
                            DropdownMenuItem(
                                text = { Text(mod.name) },
                                leadingIcon = {
                                    Checkbox(
                                        checked = isChecked,
                                        onCheckedChange = null
                                    )
                                },
                                onClick = {
                                    selectedModules = if (isChecked) {
                                        selectedModules.filter { it != mod.name }
                                    } else {
                                        selectedModules + mod.name
                                    }
                                }
                            )
                        }
                    }
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = onManageModules) {
                        Text("+ Manage Subjects", fontSize = 11.sp, color = PrimaryPurple)
                    }
                }

                OutlinedTextField(
                    value = price,
                    onValueChange = { price = it },
                    label = { Text("Monthly Price ($)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val p = price.toDoubleOrNull() ?: 0.0
                    if (firstName.isNotBlank() && lastName.isNotBlank()) {
                        onConfirm(firstName, lastName, phone, grade, selectedModules, p)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryPurple)
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@Composable
fun ManageModulesDialog(
    modules: List<Module>,
    onDismiss: () -> Unit,
    onAddModule: (String) -> Unit,
    onUpdateModule: (Module, String) -> Unit,
    onDeleteModule: (String, String) -> Unit
) {
    var newModuleName by remember { mutableStateOf("") }
    var editingModule by remember { mutableStateOf<Module?>(null) }
    var editNameText by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Manage Subjects & Modules", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = newModuleName,
                        onValueChange = { newModuleName = it },
                        placeholder = { Text("New subject (e.g. Physics)") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Button(
                        onClick = {
                            if (newModuleName.isNotBlank()) {
                                onAddModule(newModuleName.trim())
                                newModuleName = ""
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryPurple)
                    ) {
                        Text("Add")
                    }
                }

                Divider(modifier = Modifier.padding(vertical = 4.dp))

                LazyColumn(modifier = Modifier.heightIn(max = 220.dp)) {
                    items(modules, key = { it.id }) { mod ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            if (editingModule?.id == mod.id) {
                                OutlinedTextField(
                                    value = editNameText,
                                    onValueChange = { editNameText = it },
                                    modifier = Modifier.weight(1f),
                                    singleLine = true
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                IconButton(onClick = {
                                    onUpdateModule(mod, editNameText)
                                    editingModule = null
                                }) {
                                    Icon(Icons.Default.Check, contentDescription = "Save", tint = PaidGreen)
                                }
                            } else {
                                Text(mod.name, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
                                Row {
                                    IconButton(onClick = {
                                        editingModule = mod
                                        editNameText = mod.name
                                    }, modifier = Modifier.size(28.dp)) {
                                        Icon(Icons.Default.Edit, contentDescription = "Edit", tint = PrimaryPurple, modifier = Modifier.size(16.dp))
                                    }
                                    IconButton(onClick = { onDeleteModule(mod.id, mod.name) }, modifier = Modifier.size(28.dp)) {
                                        Icon(Icons.Default.Delete, contentDescription = "Delete", tint = UnpaidRed, modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = onDismiss, colors = ButtonDefaults.buttonColors(containerColor = PrimaryPurple)) {
                Text("Done")
            }
        }
    )
}

// Share / Export Functionality
private fun exportStudentsToCsv(context: Context, state: DashboardUiState) {
    val builder = StringBuilder()
    builder.append("Name,Grade,Phone,Subjects,Monthly Price ($),Paid (${state.currentMonth})\n")
    state.filteredStudents.forEach { item ->
        val s = item.student
        val isPaid = if (item.isPaidCurrentMonth == true) "Yes" else "No"
        builder.append("\"${s.firstName} ${s.lastName}\",\"${s.grade}\",\"${s.phone}\",\"${s.module}\",${s.monthlyPrice},\"$isPaid\"\n")
    }

    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/csv"
        putExtra(Intent.EXTRA_SUBJECT, "Student Tracker - ${state.currentMonth}")
        putExtra(Intent.EXTRA_TEXT, builder.toString())
    }
    context.startActivity(Intent.createChooser(intent, "Export Student Records"))
}
