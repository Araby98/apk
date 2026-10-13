package com.example.studenttracker.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.studenttracker.data.Module
import com.example.studenttracker.data.StudentWithPaymentStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentTrackerDashboard(viewModel: StudentViewModel) {
    val state by viewModel.uiState.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }
    var showManageModulesDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Student Tracker") },
                actions = {
                    TextButton(onClick = { showManageModulesDialog = true }) {
                        Text("Subjects", color = MaterialTheme.colorScheme.primary)
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }) {
                Text("+", style = MaterialTheme.typography.headlineMedium)
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // Stats Banner
            Card(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Month", style = MaterialTheme.typography.labelSmall)
                        Text(state.currentMonth, fontWeight = FontWeight.Bold)
                    }
                    Column {
                        Text("Collected / Target", style = MaterialTheme.typography.labelSmall)
                        Text("$${state.totalCollected} / $${state.totalExpected}", fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Student List
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(state.students, key = { it.student.id }) { item ->
                    StudentPaymentRow(
                        item = item,
                        onTogglePayment = {
                            viewModel.togglePaymentStatus(
                                studentId = item.student.id,
                                monthlyPrice = item.student.monthlyPrice,
                                currentlyPaid = item.isPaidCurrentMonth == true
                            )
                        }
                    )
                }
            }
        }
    }

    if (showAddDialog) {
        AddStudentDialog(
            modules = state.modules,
            onDismiss = { showAddDialog = false },
            onManageModules = {
                showAddDialog = false
                showManageModulesDialog = true
            },
            onConfirm = { fn, ln, phone, grade, module, price ->
                viewModel.addStudent(fn, ln, phone, grade, module, price)
                showAddDialog = false
            }
        )
    }

    if (showManageModulesDialog) {
        ManageModulesDialog(
            modules = state.modules,
            onDismiss = { showManageModulesDialog = false },
            onAddModule = { viewModel.addModule(it) },
            onUpdateModule = { module, newName -> viewModel.updateModule(module, newName) },
            onDeleteModule = { viewModel.deleteModule(it) }
        )
    }
}

@Composable
fun StudentPaymentRow(
    item: StudentWithPaymentStatus,
    onTogglePayment: () -> Unit
) {
    val isPaid = item.isPaidCurrentMonth == true

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isPaid) Color(0xFFE8F5E9) else Color(0xFFFFEBEE)
        )
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "${item.student.firstName} ${item.student.lastName}",
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(text = "Tel: ${item.student.phone}", style = MaterialTheme.typography.bodySmall)
                Text(
                    text = "Grade: ${item.student.grade} | Module: ${item.student.module}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.DarkGray
                )
                Text(
                    text = "Fee: $${item.student.monthlyPrice}/mo",
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Button(
                onClick = onTogglePayment,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isPaid) Color(0xFF2E7D32) else Color(0xFFC62828)
                )
            ) {
                Text(if (isPaid) "PAID" else "UNPAID")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddStudentDialog(
    modules: List<Module>,
    onDismiss: () -> Unit,
    onManageModules: () -> Unit,
    onConfirm: (String, String, String, String, String, Double) -> Unit
) {
    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var grade by remember { mutableStateOf("") }
    var selectedModule by remember { mutableStateOf(modules.firstOrNull()?.name ?: "Mathematics") }
    var isDropdownExpanded by remember { mutableStateOf(false) }
    var price by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add New Student") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = firstName,
                    onValueChange = { firstName = it },
                    label = { Text("First Name") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = lastName,
                    onValueChange = { lastName = it },
                    label = { Text("Last Name") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone Number") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = grade,
                    onValueChange = { grade = it },
                    label = { Text("Grade / Level") },
                    modifier = Modifier.fillMaxWidth()
                )

                // Dropdown Menu for Module / Subject
                ExposedDropdownMenuBox(
                    expanded = isDropdownExpanded,
                    onExpandedChange = { isDropdownExpanded = !isDropdownExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedModule,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Module / Subject") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = isDropdownExpanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = isDropdownExpanded,
                        onDismissRequest = { isDropdownExpanded = false }
                    ) {
                        modules.forEach { mod ->
                            DropdownMenuItem(
                                text = { Text(mod.name) },
                                onClick = {
                                    selectedModule = mod.name
                                    isDropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                TextButton(onClick = onManageModules, modifier = Modifier.align(Alignment.End)) {
                    Text("+ Manage Subjects", style = MaterialTheme.typography.labelSmall)
                }

                OutlinedTextField(
                    value = price,
                    onValueChange = { price = it },
                    label = { Text("Monthly Price ($)") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val p = price.toDoubleOrNull() ?: 0.0
                    if (firstName.isNotBlank() && lastName.isNotBlank()) {
                        onConfirm(firstName, lastName, phone, grade, selectedModule, p)
                    }
                }
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
    onDeleteModule: (String) -> Unit
) {
    var newModuleName by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Manage Subjects & Modules") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = newModuleName,
                        onValueChange = { newModuleName = it },
                        placeholder = { Text("New subject (e.g. Physics)") },
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            if (newModuleName.isNotBlank()) {
                                onAddModule(newModuleName.trim())
                                newModuleName = ""
                            }
                        }
                    ) {
                        Text("Add")
                    }
                }

                Divider()

                LazyColumn(modifier = Modifier.heightIn(max = 240.dp)) {
                    items(modules, key = { it.id }) { mod ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(mod.name, fontWeight = FontWeight.Medium)
                            Row {
                                TextButton(onClick = { onDeleteModule(mod.id) }) {
                                    Text("Delete", color = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = onDismiss) {
                Text("Done")
            }
        }
    )
}
