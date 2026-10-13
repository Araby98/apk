/**
 * Student Tracker - Android APK Simulation Engine
 * Emulates Android Jetpack Compose StateFlow, Room DAO & SQLite database
 */

// Initial Seed Subjects / Modules
const DEFAULT_MODULES = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Calculus II',
  'English Literature',
  'Biology'
];

// Initial Seed Students (with multi-subject support)
const DEFAULT_STUDENTS = [
  {
    id: 's-101',
    firstName: 'Alex',
    lastName: 'Rivera',
    phone: '+1 (555) 234-5678',
    grade: '10th Grade',
    modules: ['Mathematics', 'Physics'],
    monthlyPrice: 60.0,
    isActive: true
  },
  {
    id: 's-102',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    phone: '+1 (555) 876-5432',
    grade: '11th Grade',
    modules: ['Physics', 'Chemistry'],
    monthlyPrice: 75.0,
    isActive: true
  },
  {
    id: 's-103',
    firstName: 'Lucas',
    lastName: 'Vance',
    phone: '+1 (555) 345-6789',
    grade: '12th Grade',
    modules: ['Chemistry', 'Biology'],
    monthlyPrice: 50.0,
    isActive: true
  },
  {
    id: 's-104',
    firstName: 'Emily',
    lastName: 'Chen',
    phone: '+1 (555) 901-2345',
    grade: 'Bachelor 1',
    modules: ['Calculus II'],
    monthlyPrice: 85.0,
    isActive: true
  },
  {
    id: 's-105',
    firstName: 'Marcus',
    lastName: 'Sterling',
    phone: '+1 (555) 432-1098',
    grade: '10th Grade',
    modules: ['English Literature', 'Mathematics'],
    monthlyPrice: 45.0,
    isActive: true
  }
];

// Seed Payments for October 2026
const DEFAULT_PAYMENTS = [
  {
    id: 'p-201',
    studentId: 's-101',
    monthYear: '2026-10',
    amountPaid: 60.0,
    isPaid: true,
    paymentDate: Date.now() - 86400000 * 2
  },
  {
    id: 'p-202',
    studentId: 's-104',
    monthYear: '2026-10',
    amountPaid: 85.0,
    isPaid: true,
    paymentDate: Date.now() - 86400000 * 5
  }
];

class StudentTrackerApp {
  constructor() {
    this.storageKeyStudents = 'st_students_v2';
    this.storageKeyPayments = 'st_payments_v2';
    this.storageKeyModules = 'st_modules_v2';

    // State
    this.currentMonth = this.getFormattedCurrentMonth();
    this.currentViewMode = 'cards'; // 'cards' or 'table'
    this.activeFilter = 'all'; // 'all', 'paid', 'unpaid'
    this.selectedSubjectFilter = 'all';
    this.searchQuery = '';
    this.editingModule = null;
    this.currentLang = 'en'; // 'en' or 'ar'

    // Multi-select state
    this.addSelectedModules = ['Mathematics'];
    this.editSelectedModules = [];

    this.modules = this.loadModules();
    this.students = this.loadStudents();
    this.payments = this.loadPayments();

    this.initElements();
    this.bindEvents();
    this.startClock();
    this.render();
  }

  getFormattedCurrentMonth() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  loadModules() {
    const raw = localStorage.getItem(this.storageKeyModules);
    if (!raw) {
      localStorage.setItem(this.storageKeyModules, JSON.stringify(DEFAULT_MODULES));
      return [...DEFAULT_MODULES];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_MODULES];
    } catch {
      return [...DEFAULT_MODULES];
    }
  }

  loadStudents() {
    const raw = localStorage.getItem(this.storageKeyStudents);
    if (!raw) {
      localStorage.setItem(this.storageKeyStudents, JSON.stringify(DEFAULT_STUDENTS));
      return JSON.parse(JSON.stringify(DEFAULT_STUDENTS));
    }
    try {
      const parsed = JSON.parse(raw);
      parsed.forEach((s) => {
        if (!Array.isArray(s.modules)) {
          s.modules = s.module ? [s.module] : ['Mathematics'];
        }
      });
      return parsed;
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_STUDENTS));
    }
  }

  loadPayments() {
    const raw = localStorage.getItem(this.storageKeyPayments);
    if (!raw) {
      localStorage.setItem(this.storageKeyPayments, JSON.stringify(DEFAULT_PAYMENTS));
      return [...DEFAULT_PAYMENTS];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...DEFAULT_PAYMENTS];
    }
  }

  saveData() {
    localStorage.setItem(this.storageKeyStudents, JSON.stringify(this.students));
    localStorage.setItem(this.storageKeyPayments, JSON.stringify(this.payments));
    localStorage.setItem(this.storageKeyModules, JSON.stringify(this.modules));
  }

  initElements() {
    // Phone UI Elements
    this.clockEl = document.getElementById('status-clock');
    this.monthDisplayEl = document.getElementById('current-month-display');
    this.statMonthTextEl = document.getElementById('stat-month-text');
    this.statAmountTextEl = document.getElementById('stat-amount-text');
    this.statProgressBarEl = document.getElementById('stat-progress-bar');
    this.statPercentageEl = document.getElementById('stat-percentage');
    this.statUnpaidCountEl = document.getElementById('stat-unpaid-count');

    // Monthly Summary Counters
    this.summaryTotalCountEl = document.getElementById('summary-total-count');
    this.summaryPaidCountEl = document.getElementById('summary-paid-count');
    this.summaryUnpaidCountEl = document.getElementById('summary-unpaid-count');

    // View Switcher Elements
    this.viewCardsBtn = document.getElementById('view-cards-btn');
    this.viewTableBtn = document.getElementById('view-table-btn');
    this.cardsViewWrapper = document.getElementById('cards-view-wrapper');
    this.tableViewWrapper = document.getElementById('table-view-wrapper');

    // Search & Filter Elements
    this.searchInput = document.getElementById('search-input');
    this.filterTabs = document.querySelectorAll('.filter-tab');
    this.subjectFilterSelect = document.getElementById('subject-filter-select');
    this.sfDropdownTrigger = document.getElementById('sf-dropdown-trigger');
    this.sfDropdownMenuList = document.getElementById('sf-dropdown-menu-list');
    this.sfSelectedText = document.getElementById('sf-selected-text');
    this.countAllEl = document.getElementById('count-all');
    this.countPaidEl = document.getElementById('count-paid');
    this.countUnpaidEl = document.getElementById('count-unpaid');

    // Monthly Table Elements
    this.tableActiveMonthEl = document.getElementById('table-active-month');
    this.monthlyTableBody = document.getElementById('monthly-table-body');
    this.tableEmptyState = document.getElementById('table-empty-state');
    this.studentListContainer = document.getElementById('student-list-container');

    // Add Student Dialog & Multi-Select
    this.fabBtn = document.getElementById('open-add-dialog-fab');
    this.addStudentDialog = document.getElementById('add-student-dialog');
    this.addStudentForm = document.getElementById('add-student-form');
    this.closeDialogIconBtn = document.getElementById('close-dialog-icon-btn');
    this.cancelDialogBtn = document.getElementById('cancel-dialog-btn');
    this.dialogManageModulesLink = document.getElementById('dialog-manage-modules-link');

    this.addMultiTrigger = document.getElementById('add-dropdown-trigger');
    this.addSelectedChips = document.getElementById('add-selected-chips');
    this.addDropdownMenuList = document.getElementById('add-dropdown-menu-list');

    // Edit Student Dialog & Multi-Select
    this.editStudentDialog = document.getElementById('edit-student-dialog');
    this.editStudentForm = document.getElementById('edit-student-form');
    this.closeEditDialogIconBtn = document.getElementById('close-edit-dialog-icon-btn');
    this.cancelEditDialogBtn = document.getElementById('cancel-edit-dialog-btn');
    this.editManageModulesLink = document.getElementById('edit-manage-modules-link');

    this.editMultiTrigger = document.getElementById('edit-dropdown-trigger');
    this.editSelectedChips = document.getElementById('edit-selected-chips');
    this.editDropdownMenuList = document.getElementById('edit-dropdown-menu-list');

    // Manage Modules Dialog
    this.manageModulesDialog = document.getElementById('manage-modules-dialog');
    this.createModuleForm = document.getElementById('create-module-form');
    this.newModuleNameInput = document.getElementById('new-module-name-input');
    this.modulesItemsContainer = document.getElementById('modules-items-container');
    this.modulesCountBadge = document.getElementById('modules-count-badge');
    this.closeModulesDialogBtn = document.getElementById('close-modules-dialog-btn');
    this.doneModulesDialogBtn = document.getElementById('done-modules-dialog-btn');

    // Header & Navigation Buttons
    this.studioManageModulesBtn = document.getElementById('studio-manage-modules-btn');
    this.appManageModulesBtn = document.getElementById('app-manage-modules-btn');
    this.themeToggleBtn = document.getElementById('theme-toggle-btn');
    this.resetDataBtn = document.getElementById('reset-data-btn');
    this.codeDrawerBtn = document.getElementById('code-drawer-btn');
    this.codePanel = document.getElementById('code-inspector-panel');

    // Language toggle buttons
    this.studioLangToggleBtn = document.getElementById('studio-lang-toggle-btn');
    this.studioLangLabel = document.getElementById('studio-lang-label');
    this.appLangToggleBtn = document.getElementById('app-lang-toggle-btn');
    this.appLangBadgeText = document.getElementById('app-lang-badge-text');

    // Export choice buttons (new unified dialog approach)
    this.exportChoiceBtn = document.getElementById('export-choice-btn');
    this.appExportChoiceBtn = document.getElementById('app-export-choice-btn');
    this.exportChoiceDialog = document.getElementById('export-choice-dialog');
    this.closeExportDialogBtn = document.getElementById('close-export-dialog-icon-btn');
    this.cancelExportDialogBtn = document.getElementById('cancel-export-dialog-btn');
    this.triggerExcelDownloadBtn = document.getElementById('trigger-excel-download-btn');
    this.triggerPdfDownloadBtn = document.getElementById('trigger-pdf-download-btn');
    this.triggerPrintReportBtn = document.getElementById('trigger-print-report-btn');
    this.exportActiveMonthText = document.getElementById('export-active-month-text');

    this.toastEl = document.getElementById('app-toast');

    this.prevMonthBtn = document.getElementById('prev-month-btn');
    this.nextMonthBtn = document.getElementById('next-month-btn');

    // DB Inspect Elements
    this.dbStudentCountEl = document.getElementById('db-student-count');
    this.dbModuleCountEl = document.getElementById('db-module-count');
    this.dbPaymentCountEl = document.getElementById('db-payment-count');
    this.dbStudentsTableBody = document.querySelector('#db-students-table tbody');
  }

  bindEvents() {
    // View Switcher (Cards vs Table)
    if (this.viewCardsBtn) {
      this.viewCardsBtn.addEventListener('click', () => this.switchViewMode('cards'));
    }
    if (this.viewTableBtn) {
      this.viewTableBtn.addEventListener('click', () => this.switchViewMode('table'));
    }

    // Language Toggle Handlers
    if (this.studioLangToggleBtn) {
      this.studioLangToggleBtn.addEventListener('click', () => this.toggleLanguage());
    }
    if (this.appLangToggleBtn) {
      this.appLangToggleBtn.addEventListener('click', () => this.toggleLanguage());
    }

    // Export Choice Dialog Handlers
    if (this.exportChoiceBtn) {
      this.exportChoiceBtn.addEventListener('click', () => this.openExportChoiceDialog());
    }
    if (this.appExportChoiceBtn) {
      this.appExportChoiceBtn.addEventListener('click', () => this.openExportChoiceDialog());
    }
    if (this.closeExportDialogBtn) {
      this.closeExportDialogBtn.addEventListener('click', () => this.closeExportChoiceDialog());
    }
    if (this.cancelExportDialogBtn) {
      this.cancelExportDialogBtn.addEventListener('click', () => this.closeExportChoiceDialog());
    }
    if (this.exportChoiceDialog) {
      this.exportChoiceDialog.addEventListener('click', (e) => {
        if (e.target === this.exportChoiceDialog) this.closeExportChoiceDialog();
      });
    }
    if (this.triggerExcelDownloadBtn) {
      this.triggerExcelDownloadBtn.addEventListener('click', () => {
        this.closeExportChoiceDialog();
        this.exportToExcel();
      });
    }
    if (this.triggerPdfDownloadBtn) {
      this.triggerPdfDownloadBtn.addEventListener('click', () => {
        this.closeExportChoiceDialog();
        this.exportToPDF();
      });
    }
    if (this.triggerPrintReportBtn) {
      this.triggerPrintReportBtn.addEventListener('click', () => {
        this.closeExportChoiceDialog();
        window.print();
      });
    }

    // Add Student Multi-Select Trigger
    if (this.addMultiTrigger) {
      this.addMultiTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMultiDropdown('add');
      });
    }

    // Edit Student Multi-Select Trigger
    if (this.editMultiTrigger) {
      this.editMultiTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMultiDropdown('edit');
      });
    }

    // Subject Filter Custom Dropdown Trigger
    if (this.sfDropdownTrigger) {
      this.sfDropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSubjectFilterDropdown();
      });
      this.sfDropdownTrigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleSubjectFilterDropdown();
        }
      });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      const addContainer = document.getElementById('add-multi-select');
      const editContainer = document.getElementById('edit-multi-select');
      const sfContainer = document.getElementById('subject-filter-custom-dropdown');
      if (addContainer && !addContainer.contains(e.target)) {
        this.closeMultiDropdown('add');
      }
      if (editContainer && !editContainer.contains(e.target)) {
        this.closeMultiDropdown('edit');
      }
      if (sfContainer && !sfContainer.contains(e.target)) {
        this.closeSubjectFilterDropdown();
      }
    });

    // Add Student FAB & Dialog
    this.fabBtn.addEventListener('click', () => this.openAddDialog());
    this.closeDialogIconBtn.addEventListener('click', () => this.closeAddDialog());
    this.cancelDialogBtn.addEventListener('click', () => this.closeAddDialog());
    this.addStudentDialog.addEventListener('click', (e) => {
      if (e.target === this.addStudentDialog) this.closeAddDialog();
    });

    this.addStudentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddStudentSubmit();
    });

    this.dialogManageModulesLink.addEventListener('click', () => {
      this.closeAddDialog();
      this.openManageModulesDialog();
    });

    // Edit Student Dialog
    this.closeEditDialogIconBtn.addEventListener('click', () => this.closeEditDialog());
    this.cancelEditDialogBtn.addEventListener('click', () => this.closeEditDialog());
    this.editStudentDialog.addEventListener('click', (e) => {
      if (e.target === this.editStudentDialog) this.closeEditDialog();
    });

    this.editStudentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleEditStudentSubmit();
    });

    this.editManageModulesLink.addEventListener('click', () => {
      this.closeEditDialog();
      this.openManageModulesDialog();
    });

    // Modules Management Buttons & Modal
    if (this.studioManageModulesBtn) {
      this.studioManageModulesBtn.addEventListener('click', () => this.openManageModulesDialog());
    }
    if (this.appManageModulesBtn) {
      this.appManageModulesBtn.addEventListener('click', () => this.openManageModulesDialog());
    }
    this.closeModulesDialogBtn.addEventListener('click', () => this.closeManageModulesDialog());
    this.doneModulesDialogBtn.addEventListener('click', () => this.closeManageModulesDialog());
    this.manageModulesDialog.addEventListener('click', (e) => {
      if (e.target === this.manageModulesDialog) this.closeManageModulesDialog();
    });

    this.createModuleForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateModule();
    });

    // Month Navigation
    this.prevMonthBtn.addEventListener('click', () => this.shiftMonth(-1));
    this.nextMonthBtn.addEventListener('click', () => this.shiftMonth(1));

    // Filters (Status Tabs)
    this.filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        this.filterTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeFilter = tab.dataset.filter;
        this.renderLists();
      });
    });

    // Subject Filter Dropdown
    if (this.subjectFilterSelect) {
      this.subjectFilterSelect.addEventListener('change', (e) => {
        this.selectedSubjectFilter = e.target.value;
        this.renderLists();
      });
    }

    // Search Query
    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderLists();
    });

    // Theme Toggle
    this.themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      this.showToast(isDark ? 'Dark Theme activated' : 'Light Theme activated');
    });

    // Reset Data
    this.resetDataBtn.addEventListener('click', () => {
      if (confirm('Reset to initial sample students, subjects, and payments?')) {
        this.students = JSON.parse(JSON.stringify(DEFAULT_STUDENTS));
        this.payments = JSON.parse(JSON.stringify(DEFAULT_PAYMENTS));
        this.modules = [...DEFAULT_MODULES];
        this.saveData();
        this.render();
        this.showToast('Demo data restored');
      }
    });

    // Panel Tabs
    document.querySelectorAll('.panel-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.panel-tab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
        tab.classList.add('active');
        const targetId = `pane-${tab.dataset.tab}`;
        document.getElementById(targetId)?.classList.add('active');
      });
    });

    // Code Drawer Toggle
    this.codeDrawerBtn.addEventListener('click', () => {
      if (this.codePanel) {
        this.codePanel.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  startClock() {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      if (this.clockEl) this.clockEl.textContent = `${hours}:${minutes}`;
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  shiftMonth(offset) {
    const [yStr, mStr] = this.currentMonth.split('-');
    let year = parseInt(yStr, 10);
    let month = parseInt(mStr, 10) + offset;
    if (month > 12) {
      year += 1;
      month = 1;
    } else if (month < 1) {
      year -= 1;
      month = 12;
    }
    this.currentMonth = `${year}-${String(month).padStart(2, '0')}`;
    this.render();
    this.showToast(`Switched to month: ${this.currentMonth}`);
  }

  switchViewMode(mode) {
    this.currentViewMode = mode;
    if (mode === 'cards') {
      this.viewCardsBtn.classList.add('active');
      this.viewTableBtn.classList.remove('active');
      this.cardsViewWrapper.classList.remove('hidden');
      this.tableViewWrapper.classList.add('hidden');
    } else {
      this.viewCardsBtn.classList.remove('active');
      this.viewTableBtn.classList.add('active');
      this.cardsViewWrapper.classList.add('hidden');
      this.tableViewWrapper.classList.remove('hidden');
    }
  }

  // --- MULTI-SELECT SUBJECT DROPDOWN ENGINE ---

  toggleMultiDropdown(context) {
    const menu = context === 'add' ? this.addDropdownMenuList : this.editDropdownMenuList;
    const trigger = context === 'add' ? this.addMultiTrigger : this.editMultiTrigger;
    if (!menu || !trigger) return;

    if (menu.classList.contains('hidden')) {
      menu.classList.remove('hidden');
      trigger.classList.add('open');
    } else {
      menu.classList.add('hidden');
      trigger.classList.remove('open');
    }
  }

  closeMultiDropdown(context) {
    const menu = context === 'add' ? this.addDropdownMenuList : this.editDropdownMenuList;
    const trigger = context === 'add' ? this.addMultiTrigger : this.editMultiTrigger;
    if (menu) menu.classList.add('hidden');
    if (trigger) trigger.classList.remove('open');
  }

  renderMultiSelect(context) {
    const chipsContainer = context === 'add' ? this.addSelectedChips : this.editSelectedChips;
    const menuList = context === 'add' ? this.addDropdownMenuList : this.editDropdownMenuList;
    const selected = context === 'add' ? this.addSelectedModules : this.editSelectedModules;

    if (!chipsContainer || !menuList) return;

    // 1. Render Selected Chips
    chipsContainer.innerHTML = '';
    if (selected.length === 0) {
      chipsContainer.innerHTML = '<span class="placeholder-text">Select subjects...</span>';
    } else {
      selected.forEach((mod) => {
        const chip = document.createElement('span');
        chip.className = 'select-chip';
        chip.innerHTML = `
          <span>${mod}</span>
          <span class="select-chip-remove" title="Remove">&times;</span>
        `;
        chip.querySelector('.select-chip-remove').addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeModuleSelection(context, mod);
        });
        chipsContainer.appendChild(chip);
      });
    }

    // 2. Render Checkbox Options in Dropdown Menu
    menuList.innerHTML = '';
    if (this.modules.length === 0) {
      menuList.innerHTML = '<div style="padding: 10px; font-size: 0.8rem; color: var(--phone-text-muted);">No subjects created. Add one above!</div>';
      return;
    }

    this.modules.forEach((mod) => {
      const isChecked = selected.includes(mod);
      const row = document.createElement('div');
      row.className = `dropdown-menu-item multi-item ${isChecked ? 'selected' : ''}`;

      row.innerHTML = `
        <div class="multi-item-left">
          <input type="checkbox" class="multi-checkbox" ${isChecked ? 'checked' : ''}>
          <span class="dropdown-item-dot"></span>
          <span>${mod}</span>
        </div>
      `;

      const checkbox = row.querySelector('.multi-checkbox');
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleModuleSelection(context, mod);
      });
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleModuleSelection(context, mod);
      });

      menuList.appendChild(row);
    });
  }

  toggleModuleSelection(context, mod) {
    let list = context === 'add' ? this.addSelectedModules : this.editSelectedModules;
    if (list.includes(mod)) {
      list = list.filter((m) => m !== mod);
    } else {
      list.push(mod);
    }

    if (context === 'add') {
      this.addSelectedModules = list;
    } else {
      this.editSelectedModules = list;
    }
    this.renderMultiSelect(context);
  }

  removeModuleSelection(context, mod) {
    if (context === 'add') {
      this.addSelectedModules = this.addSelectedModules.filter((m) => m !== mod);
    } else {
      this.editSelectedModules = this.editSelectedModules.filter((m) => m !== mod);
    }
    this.renderMultiSelect(context);
  }

  // --- EXPORT CHOICE DIALOG ---

  openExportChoiceDialog() {
    if (!this.exportChoiceDialog) return;
    if (this.exportActiveMonthText) this.exportActiveMonthText.textContent = this.currentMonth;
    this.exportChoiceDialog.classList.remove('hidden');
  }

  closeExportChoiceDialog() {
    if (!this.exportChoiceDialog) return;
    this.exportChoiceDialog.classList.add('hidden');
  }

  // --- EXCEL EXPORT ENGINE (.xls) ---

  exportToExcel() {
    if (this.students.length === 0) {
      this.showToast(this.t('noStudentsExport'));
      return;
    }

    const month = this.currentMonth;
    const isAr = this.currentLang === 'ar';

    let tableRows = '';
    this.students.forEach((s, idx) => {
      const fullName = `${s.firstName} ${s.lastName}`.trim();
      const modulesStr = Array.isArray(s.modules) ? s.modules.join(', ') : (s.module || 'General');
      const payment = this.payments.find((p) => p.studentId === s.id && p.monthYear === month);
      const isPaid = payment ? payment.isPaid : false;
      const amountPaid = isPaid ? (payment.amountPaid || s.monthlyPrice) : 0.0;
      const statusColor = isPaid ? '#2e7d32' : '#c62828';
      const statusBg = isPaid ? '#e8f5e9' : '#ffebee';
      const statusText = isPaid ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No');

      tableRows += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><b>${fullName}</b></td>
          <td>${s.phone}</td>
          <td>${s.grade}</td>
          <td style="color: #6750a4; font-weight: 500;">${modulesStr}</td>
          <td style="text-align: right;">$${s.monthlyPrice.toFixed(2)}</td>
          <td style="text-align: center;">${month}</td>
          <td style="text-align: center; color: ${statusColor}; background-color: ${statusBg}; font-weight: bold;">${statusText}</td>
          <td style="text-align: right; font-weight: bold;">$${amountPaid.toFixed(2)}</td>
        </tr>
      `;
    });

    const reportTitle = isAr ? `تقرير نظام تتبع الطلاب - (${month})` : `Student Tracker - Report (${month})`;
    const headers = isAr
      ? ['#', 'الاسم الكامل', 'رقم الهاتف', 'المستوى / الصف', 'المواد', 'الرسوم الشهرية ($)', 'الشهر', 'الدفع (نعم/لا)', 'المبلغ المدفوع ($)']
      : ['#', 'Full Name', 'Phone Number', 'Grade / Level', 'Subjects / Modules', 'Monthly Price ($)', 'Month', 'Paid (Yes/No)', 'Amount Paid ($)'];

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
          <x:Name>Student Tracker ${month}</x:Name>
          <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          th { background-color: #6750a4; color: #ffffff; padding: 10px; font-weight: bold; border: 1px solid #4a3780; }
          td { padding: 8px 10px; border: 1px solid #dcdcdc; font-family: Calibri, Arial, sans-serif; }
        </style>
      </head>
      <body${isAr ? ' dir="rtl"' : ''}>
        <h2 style="font-family: Arial; color: #6750a4;">${reportTitle}</h2>
        <table border="1" style="border-collapse: collapse; font-family: Calibri, Arial, sans-serif;">
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
      </html>
    `;

    const base64Data = btoa(unescape(encodeURIComponent(excelHtml)));
    const excelDataUri = 'data:application/vnd.ms-excel;charset=utf-8;base64,' + base64Data;
    const fileName = `Student_Tracker_${month}.xls`;

    const a = document.createElement('a');
    a.href = excelDataUri;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    this.showToast(`📊 ${isAr ? 'تم تصدير' : 'Exported'} ${this.students.length} ${isAr ? 'طالب إلى Excel' : 'students to Excel'} (${fileName})!`);
  }

  // --- PDF EXPORT ENGINE (jsPDF + AutoTable) ---

  exportToPDF() {
    if (this.students.length === 0) {
      this.showToast(this.t('noStudentsExport'));
      return;
    }

    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      this.showToast('jsPDF library not loaded. Please check your internet connection.');
      return;
    }

    const month = this.currentMonth;
    const isAr = this.currentLang === 'ar';
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

    // Title
    doc.setFontSize(18);
    doc.setTextColor(103, 80, 164);
    const title = isAr ? `تقرير نظام تتبع الطلاب` : 'Student Tracker - Monthly Report';
    doc.text(title, 40, 50);

    // Subtitle / Month
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`${isAr ? 'الشهر:' : 'Month:'} ${month}   |   ${isAr ? 'إجمالي الطلاب:' : 'Total Students:'} ${this.students.length}`, 40, 72);

    // Summary stats
    const paidCount = this.students.filter(s => {
      const p = this.payments.find(pm => pm.studentId === s.id && pm.monthYear === month);
      return p && p.isPaid;
    }).length;
    const unpaidCount = this.students.length - paidCount;

    doc.setFontSize(10);
    doc.setTextColor(46, 125, 50);
    doc.text(`${isAr ? 'مدفوع:' : 'Paid:'} ${paidCount}`, 40, 90);
    doc.setTextColor(198, 40, 40);
    doc.text(`${isAr ? ' غير مدفوع:' : 'Unpaid:'} ${unpaidCount}`, isAr ? 40 : 120, 90);

    // Table headers
    const head = isAr
      ? [['#', 'الاسم الكامل', 'المواد الدراسية', 'الرسوم الشهرية', 'الدفع']]
      : [['#', 'Full Name', 'Subjects', 'Monthly Fee', 'Paid']];

    const body = this.students.map((s, idx) => {
      const modulesStr = Array.isArray(s.modules) ? s.modules.join(', ') : (s.module || 'General');
      const payment = this.payments.find(p => p.studentId === s.id && p.monthYear === month);
      const isPaid = payment ? payment.isPaid : false;
      return [
        String(idx + 1),
        `${s.firstName} ${s.lastName}`,
        modulesStr,
        `$${s.monthlyPrice.toFixed(2)}`,
        isPaid ? (isAr ? '✓ نعم' : '✓ Yes') : (isAr ? '✗ لا' : '✗ No')
      ];
    });

    doc.autoTable({
      startY: 105,
      head: head,
      body: body,
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [103, 80, 164], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 246, 251] },
      columnStyles: {
        4: {
          halign: 'center',
          fontStyle: 'bold',
          textColor: (cell) => {
            const val = cell.text[0] || '';
            return val.includes('✓') ? [46, 125, 50] : [198, 40, 40];
          }
        }
      },
      didDrawCell: (data) => {
        if (data.column.index === 4 && data.section === 'body') {
          const val = data.cell.text[0] || '';
          if (val.includes('✓')) {
            data.doc.setTextColor(46, 125, 50);
          } else {
            data.doc.setTextColor(198, 40, 40);
          }
        }
      },
      margin: { left: 40, right: 40 }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Student Tracker  |  ${month}  |  Page ${i} of ${pageCount}`, 40, doc.internal.pageSize.height - 20);
    }

    const fileName = `Student_Tracker_${month}.pdf`;
    doc.save(fileName);
    this.showToast(`📄 ${isAr ? 'تم تصدير' : 'Exported'} ${this.students.length} ${isAr ? 'طالب إلى PDF' : 'students to PDF'} (${fileName})!`);
  }

  // --- LANGUAGE (i18n) ENGINE ---

  /**
   * Centralized translation map for English / Arabic
   */
  get translations() {
    return {
      en: {
        appTitle: 'Student Tracker',
        selectedMonth: 'Selected Month',
        collectedTarget: 'Collected / Target',
        totalStudents: 'Total Students',
        paidYes: 'Paid (Yes)',
        unpaidNo: 'Unpaid (No)',
        cardsView: 'Cards View',
        tableView: 'Table View',
        searchPlaceholder: 'Search student or subject...',
        filterAll: 'All',
        filterPaid: 'Paid: Yes',
        filterUnpaid: 'Unpaid: No',
        allSubjects: 'All Subjects',
        swipeHint: 'Swipe left to delete \u00a0•\u00a0 Tap ✏️ to edit',
        tblTitle: 'Monthly Status Table:',
        colName: 'Name',
        colSubject: 'Subject(s)',
        colPaid: 'Paid (Yes/No)',
        toggleLangBtn: 'العربية (AR)',
        langBadge: 'AR',
        noStudentsExport: 'No students to export!',
        exportDialogTitle: 'Export Student Records',
        exportDialogSubtitle: 'Choose format to download student list for',
        exportExcelTitle: 'Microsoft Excel (.xls)',
        exportPdfTitle: 'PDF Document (.pdf)',
      },
      ar: {
        appTitle: 'متتبع الطلاب',
        selectedMonth: 'الشهر المحدد',
        collectedTarget: 'المُحصَّل / المستهدف',
        totalStudents: 'إجمالي الطلاب',
        paidYes: 'مدفوع',
        unpaidNo: 'غير مدفوع',
        cardsView: 'عرض البطاقات',
        tableView: 'عرض الجدول',
        searchPlaceholder: 'ابحث عن طالب أو مادة...',
        filterAll: 'الكل',
        filterPaid: 'مدفوع',
        filterUnpaid: 'غير مدفوع',
        allSubjects: 'كل المواد',
        swipeHint: 'اسحب يساراً للحذف \u00a0•\u00a0 اضغط ✏️ للتعديل',
        tblTitle: 'جدول الحالة الشهرية:',
        colName: 'الاسم',
        colSubject: 'المادة (المواد)',
        colPaid: 'الدفع (نعم/لا)',
        toggleLangBtn: 'English (EN)',
        langBadge: 'EN',
        noStudentsExport: 'لا يوجد طلاب للتصدير!',
        exportDialogTitle: 'تصدير سجلات الطلاب',
        exportDialogSubtitle: 'اختر صيغة تحميل قائمة الطلاب للشهر',
        exportExcelTitle: 'Microsoft Excel (.xls)',
        exportPdfTitle: 'مستند PDF (.pdf)',
      }
    };
  }

  t(key) {
    return (this.translations[this.currentLang] || this.translations['en'])[key] || key;
  }

  toggleLanguage() {
    this.currentLang = this.currentLang === 'en' ? 'ar' : 'en';
    this.applyLanguage();
    this.showToast(this.currentLang === 'ar' ? '🌐 تم التبديل إلى العربية' : '🌐 Switched to English');
  }

  applyLanguage() {
    const isAr = this.currentLang === 'ar';
    const phoneScreen = document.getElementById('app-screen');

    // Apply RTL to phone screen
    if (phoneScreen) {
      if (isAr) {
        phoneScreen.setAttribute('dir', 'rtl');
        phoneScreen.classList.add('lang-ar');
      } else {
        phoneScreen.removeAttribute('dir');
        phoneScreen.classList.remove('lang-ar');
      }
    }

    // Update studio-level language toggle label
    if (this.studioLangLabel) this.studioLangLabel.textContent = this.t('toggleLangBtn');
    if (this.appLangBadgeText) this.appLangBadgeText.textContent = this.t('langBadge');

    // Update all labelled elements in the phone UI
    const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setTxt('app-title-text', this.t('appTitle'));
    setTxt('lbl-selected-month', this.t('selectedMonth'));
    setTxt('lbl-collected-target', this.t('collectedTarget'));
    setTxt('lbl-summary-total', this.t('totalStudents'));
    setTxt('lbl-summary-paid', this.t('paidYes'));
    setTxt('lbl-summary-unpaid', this.t('unpaidNo'));
    setTxt('lbl-cards-view', this.t('cardsView'));
    setTxt('lbl-table-view', this.t('tableView'));
    setTxt('lbl-tab-all', this.t('filterAll'));
    setTxt('lbl-tab-paid', this.t('filterPaid'));
    setTxt('lbl-tab-unpaid', this.t('filterUnpaid'));
    setTxt('lbl-swipe-hint', this.t('swipeHint'));
    setTxt('lbl-tbl-title', this.t('tblTitle'));
    setTxt('th-col-name', this.t('colName'));
    setTxt('th-col-subject', this.t('colSubject'));
    setTxt('th-col-paid', this.t('colPaid'));
    setTxt('opt-all-subjects', this.t('allSubjects'));
    setTxt('export-dialog-title', this.t('exportDialogTitle'));
    setTxt('export-dialog-subtitle', this.t('exportDialogSubtitle'));
    setTxt('export-excel-title', this.t('exportExcelTitle'));
    setTxt('export-pdf-title', this.t('exportPdfTitle'));

    // Update search input placeholder
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.placeholder = this.t('searchPlaceholder');

    this.renderSubjectFilterOptions();

    // Re-render to get updated Yes/No text in the cards and table
    this.renderLists();
  }

  // --- MODULE / SUBJECT CRUD OPERATIONS ---


  openManageModulesDialog() {
    this.editingModule = null;
    this.manageModulesDialog.classList.remove('hidden');
    this.renderManageModulesList();
    setTimeout(() => this.newModuleNameInput?.focus(), 100);
  }

  closeManageModulesDialog() {
    this.editingModule = null;
    this.manageModulesDialog.classList.add('hidden');
    this.createModuleForm.reset();
    this.renderSubjectFilterOptions();
    this.renderMultiSelect('add');
    this.renderMultiSelect('edit');
  }

  handleCreateModule() {
    const name = this.newModuleNameInput.value.trim();
    if (!name) return;

    const exists = this.modules.some((m) => m.toLowerCase() === name.toLowerCase());
    if (exists) {
      this.showToast(`Subject "${name}" already exists!`);
      return;
    }

    this.modules.push(name);
    this.saveData();
    this.newModuleNameInput.value = '';
    this.renderManageModulesList();
    this.renderSubjectFilterOptions();
    this.renderMultiSelect('add');
    this.renderMultiSelect('edit');
    this.renderInspector();
    this.showToast(`Added subject "${name}"`);
  }

  updateModule(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed) {
      this.showToast('Subject name cannot be empty');
      return;
    }

    if (trimmed.toLowerCase() !== oldName.toLowerCase()) {
      const exists = this.modules.some((m) => m.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        this.showToast(`Subject "${trimmed}" already exists`);
        return;
      }
    }

    const idx = this.modules.indexOf(oldName);
    if (idx !== -1) {
      this.modules[idx] = trimmed;
    }

    let updatedCount = 0;
    this.students.forEach((s) => {
      if (Array.isArray(s.modules) && s.modules.includes(oldName)) {
        s.modules = s.modules.map((m) => (m === oldName ? trimmed : m));
        updatedCount++;
      }
    });

    this.addSelectedModules = this.addSelectedModules.map((m) => (m === oldName ? trimmed : m));
    this.editSelectedModules = this.editSelectedModules.map((m) => (m === oldName ? trimmed : m));

    if (this.selectedSubjectFilter === oldName) {
      this.selectedSubjectFilter = trimmed;
    }

    this.editingModule = null;
    this.saveData();
    this.renderManageModulesList();
    this.renderSubjectFilterOptions();
    this.renderMultiSelect('add');
    this.renderMultiSelect('edit');
    this.renderLists();
    this.renderInspector();

    this.showToast(`Updated to "${trimmed}" (${updatedCount} students updated)`);
  }

  deleteModule(name) {
    const enrolledCount = this.students.filter(
      (s) => Array.isArray(s.modules) && s.modules.includes(name)
    ).length;

    let confirmMsg = `Delete subject "${name}"?`;
    if (enrolledCount > 0) {
      confirmMsg = `Warning: ${enrolledCount} student(s) currently take "${name}". Delete subject anyway?`;
    }

    if (!confirm(confirmMsg)) return;

    this.modules = this.modules.filter((m) => m !== name);
    this.students.forEach((s) => {
      if (Array.isArray(s.modules)) {
        s.modules = s.modules.filter((m) => m !== name);
      }
    });

    this.addSelectedModules = this.addSelectedModules.filter((m) => m !== name);
    this.editSelectedModules = this.editSelectedModules.filter((m) => m !== name);

    if (this.selectedSubjectFilter === name) {
      this.selectedSubjectFilter = 'all';
    }

    this.saveData();
    this.renderManageModulesList();
    this.renderSubjectFilterOptions();
    this.renderMultiSelect('add');
    this.renderMultiSelect('edit');
    this.renderLists();
    this.renderInspector();
    this.showToast(`Deleted subject "${name}"`);
  }

  renderManageModulesList() {
    if (!this.modulesItemsContainer) return;
    this.modulesItemsContainer.innerHTML = '';
    this.modulesCountBadge.textContent = this.modules.length;

    if (this.modules.length === 0) {
      this.modulesItemsContainer.innerHTML = `
        <div style="text-align:center; padding: 20px; color: var(--phone-text-muted); font-size: 0.8rem;">
          No subjects created yet. Add one above!
        </div>
      `;
      return;
    }

    this.modules.forEach((mod) => {
      const enrolledCount = this.students.filter(
        (s) => Array.isArray(s.modules) && s.modules.includes(mod)
      ).length;

      const row = document.createElement('div');
      row.className = 'module-item-row';

      if (this.editingModule === mod) {
        row.innerHTML = `
          <form class="inline-edit-form">
            <input type="text" class="inline-edit-input" value="${mod}" required>
            <button type="submit" class="inline-action-btn save">Save</button>
            <button type="button" class="inline-action-btn cancel">Cancel</button>
          </form>
        `;

        const form = row.querySelector('.inline-edit-form');
        const input = row.querySelector('.inline-edit-input');
        const cancelBtn = row.querySelector('.inline-action-btn.cancel');

        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.updateModule(mod, input.value);
        });

        cancelBtn.addEventListener('click', () => {
          this.editingModule = null;
          this.renderManageModulesList();
        });

        setTimeout(() => input.focus(), 50);
      } else {
        row.innerHTML = `
          <div class="module-item-info">
            <div class="module-color-dot"></div>
            <span class="module-item-name">${mod}</span>
            <span class="module-student-count">(${enrolledCount} enrolled)</span>
          </div>
          <div class="module-actions">
            <button class="module-action-btn edit" title="Rename subject">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            <button class="module-action-btn delete" title="Delete subject">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        `;

        const editBtn = row.querySelector('.module-action-btn.edit');
        const delBtn = row.querySelector('.module-action-btn.delete');

        editBtn.addEventListener('click', () => {
          this.editingModule = mod;
          this.renderManageModulesList();
        });

        delBtn.addEventListener('click', () => {
          this.deleteModule(mod);
        });
      }

      this.modulesItemsContainer.appendChild(row);
    });
  }

  // --- SUBJECT FILTER CUSTOM DROPDOWN ---

  toggleSubjectFilterDropdown() {
    if (!this.sfDropdownMenuList || !this.sfDropdownTrigger) return;
    const isHidden = this.sfDropdownMenuList.classList.contains('hidden');
    if (isHidden) {
      this.renderSubjectFilterOptions();
      this.sfDropdownMenuList.classList.remove('hidden');
      this.sfDropdownTrigger.classList.add('open');
    } else {
      this.sfDropdownMenuList.classList.add('hidden');
      this.sfDropdownTrigger.classList.remove('open');
    }
  }

  closeSubjectFilterDropdown() {
    if (this.sfDropdownMenuList) this.sfDropdownMenuList.classList.add('hidden');
    if (this.sfDropdownTrigger) this.sfDropdownTrigger.classList.remove('open');
  }

  selectSubjectFilter(val) {
    this.selectedSubjectFilter = val;
    this.closeSubjectFilterDropdown();
    this.renderSubjectFilterOptions();
    this.renderLists();
  }

  renderSubjectFilterOptions() {
    const currentVal = this.selectedSubjectFilter || 'all';

    // 1. Update the trigger display text
    if (this.sfSelectedText) {
      this.sfSelectedText.textContent = (currentVal === 'all')
        ? this.t('allSubjects')
        : currentVal;
    }

    // 2. Sync fallback native select if present
    if (this.subjectFilterSelect) {
      this.subjectFilterSelect.innerHTML = `<option value="all">${this.t('allSubjects')}</option>`;
      this.modules.forEach((mod) => {
        const opt = document.createElement('option');
        opt.value = mod;
        opt.textContent = mod;
        if (mod === currentVal) opt.selected = true;
        this.subjectFilterSelect.appendChild(opt);
      });
      this.subjectFilterSelect.value = currentVal;
    }

    // 3. Render custom dropdown options
    if (!this.sfDropdownMenuList) return;
    this.sfDropdownMenuList.innerHTML = '';

    // "All Subjects" option
    const allItem = document.createElement('div');
    const isAllSelected = (currentVal === 'all');
    allItem.className = `dropdown-menu-item sf-menu-item-all ${isAllSelected ? 'selected' : ''}`;
    allItem.setAttribute('role', 'button');
    allItem.setAttribute('tabindex', '0');
    allItem.innerHTML = `
      <div class="dropdown-item-left">
        <span class="dropdown-item-dot"></span>
        <span>${this.t('allSubjects')}</span>
      </div>
      ${isAllSelected ? `
        <svg class="dropdown-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ` : ''}
    `;
    allItem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectSubjectFilter('all');
    });
    this.sfDropdownMenuList.appendChild(allItem);

    // Dynamic subjects
    this.modules.forEach((mod) => {
      const isSelected = (currentVal === mod);
      const item = document.createElement('div');
      item.className = `dropdown-menu-item ${isSelected ? 'selected' : ''}`;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.innerHTML = `
        <div class="dropdown-item-left">
          <span class="dropdown-item-dot"></span>
          <span>${mod}</span>
        </div>
        ${isSelected ? `
          <svg class="dropdown-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ` : ''}
      `;
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectSubjectFilter(mod);
      });
      this.sfDropdownMenuList.appendChild(item);
    });
  }

  // --- ADD STUDENT FLOW ---

  openAddDialog() {
    this.closeMultiDropdown('add');
    if (this.modules.length > 0 && this.addSelectedModules.length === 0) {
      this.addSelectedModules = [this.modules[0]];
    }
    this.renderMultiSelect('add');
    this.addStudentDialog.classList.remove('hidden');
    document.getElementById('input-first-name')?.focus();
  }

  closeAddDialog() {
    this.closeMultiDropdown('add');
    this.addStudentDialog.classList.add('hidden');
    this.addStudentForm.reset();
  }

  handleAddStudentSubmit() {
    const firstName = document.getElementById('input-first-name').value.trim();
    const lastName = document.getElementById('input-last-name').value.trim();
    const phone = document.getElementById('input-phone').value.trim() || 'N/A';
    const grade = document.getElementById('input-grade').value.trim() || 'General';
    const price = parseFloat(document.getElementById('input-price').value) || 0.0;
    const selectedMods = this.addSelectedModules.length > 0 ? [...this.addSelectedModules] : ['General'];

    if (!firstName || !lastName) {
      alert('First and Last name are required');
      return;
    }

    const newStudent = {
      id: 's-' + Date.now().toString(36),
      firstName,
      lastName,
      phone,
      grade,
      modules: selectedMods,
      monthlyPrice: price,
      isActive: true
    };

    this.students.unshift(newStudent);
    this.saveData();
    this.closeAddDialog();
    this.render();
    this.showToast(`Added ${firstName} ${lastName}`);
  }

  // --- EDIT STUDENT FLOW ---

  openEditDialog(studentId) {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) return;

    this.closeMultiDropdown('edit');
    document.getElementById('edit-student-id').value = student.id;
    document.getElementById('edit-first-name').value = student.firstName;
    document.getElementById('edit-last-name').value = student.lastName;
    document.getElementById('edit-phone').value = student.phone === 'N/A' ? '' : student.phone;
    document.getElementById('edit-grade').value = student.grade;
    document.getElementById('edit-price').value = student.monthlyPrice;

    this.editSelectedModules = Array.isArray(student.modules)
      ? [...student.modules]
      : (student.module ? [student.module] : ['General']);

    this.renderMultiSelect('edit');
    this.editStudentDialog.classList.remove('hidden');
  }

  closeEditDialog() {
    this.closeMultiDropdown('edit');
    this.editStudentDialog.classList.add('hidden');
    this.editStudentForm.reset();
  }

  handleEditStudentSubmit() {
    const studentId = document.getElementById('edit-student-id').value;
    const student = this.students.find((s) => s.id === studentId);
    if (!student) return;

    const firstName = document.getElementById('edit-first-name').value.trim();
    const lastName = document.getElementById('edit-last-name').value.trim();
    const phone = document.getElementById('edit-phone').value.trim() || 'N/A';
    const grade = document.getElementById('edit-grade').value.trim() || 'General';
    const price = parseFloat(document.getElementById('edit-price').value) || 0.0;
    const selectedMods = this.editSelectedModules.length > 0 ? [...this.editSelectedModules] : ['General'];

    if (!firstName || !lastName) {
      alert('First and Last name are required');
      return;
    }

    student.firstName = firstName;
    student.lastName = lastName;
    student.phone = phone;
    student.grade = grade;
    student.modules = selectedMods;
    student.monthlyPrice = price;

    this.saveData();
    this.closeEditDialog();
    this.render();
    this.showToast(`Updated ${firstName} ${lastName}`);
  }

  // --- PAYMENT & STUDENT MANAGEMENT ---

  togglePayment(studentId, monthlyPrice) {
    const existingIndex = this.payments.findIndex(
      (p) => p.studentId === studentId && p.monthYear === this.currentMonth
    );

    let isNowPaid = false;

    if (existingIndex >= 0) {
      const current = this.payments[existingIndex];
      if (current.isPaid) {
        current.isPaid = false;
        current.amountPaid = 0.0;
        current.paymentDate = null;
        isNowPaid = false;
      } else {
        current.isPaid = true;
        current.amountPaid = monthlyPrice;
        current.paymentDate = Date.now();
        isNowPaid = true;
      }
    } else {
      this.payments.push({
        id: 'p-' + Date.now().toString(36),
        studentId: studentId,
        monthYear: this.currentMonth,
        amountPaid: monthlyPrice,
        isPaid: true,
        paymentDate: Date.now()
      });
      isNowPaid = true;
    }

    this.saveData();
    this.render();

    const student = this.students.find((s) => s.id === studentId);
    const name = student ? `${student.firstName} ${student.lastName}` : 'Student';
    this.showToast(isNowPaid ? `Marked ${name} as PAID (Yes)` : `Marked ${name} as UNPAID (No)`);
  }

  deleteStudent(studentId, name) {
    this.students = this.students.filter((s) => s.id !== studentId);
    this.payments = this.payments.filter((p) => p.studentId !== studentId);
    this.saveData();
    this.render();
    this.showToast(`Deleted ${name}`);
  }

  showToast(message) {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.classList.remove('hidden');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastEl.classList.add('hidden');
    }, 2800);
  }

  render() {
    this.renderSubjectFilterOptions();
    this.renderStats();
    this.renderLists();
    this.renderInspector();
  }

  renderStats() {
    this.monthDisplayEl.textContent = this.currentMonth;
    this.statMonthTextEl.textContent = this.currentMonth;
    if (this.tableActiveMonthEl) {
      this.tableActiveMonthEl.textContent = this.currentMonth;
    }

    let totalExpected = 0.0;
    let totalCollected = 0.0;
    let paidCount = 0;
    let unpaidCount = 0;

    const activeStudents = this.students.filter((s) => s.isActive);
    const totalCount = activeStudents.length;

    activeStudents.forEach((s) => {
      totalExpected += s.monthlyPrice;
      const p = this.payments.find(
        (pm) => pm.studentId === s.id && pm.monthYear === this.currentMonth
      );
      if (p && p.isPaid) {
        totalCollected += p.amountPaid;
        paidCount++;
      } else {
        unpaidCount++;
      }
    });

    const percent = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    // Header stats banner
    this.statAmountTextEl.textContent = `$${totalCollected.toFixed(2)} / $${totalExpected.toFixed(2)}`;
    this.statProgressBarEl.style.width = `${Math.min(100, percent)}%`;
    const isAr = this.currentLang === 'ar';
    this.statPercentageEl.textContent = isAr ? `${percent}% تم التحصيل` : `${percent}% collected`;
    this.statUnpaidCountEl.textContent = isAr ? `${unpaidCount} غير مدفوع` : `${unpaidCount} unpaid`;

    // Monthly Summary Counters: Total, Paid (Yes), Unpaid (No)
    if (this.summaryTotalCountEl) this.summaryTotalCountEl.textContent = totalCount;
    if (this.summaryPaidCountEl) this.summaryPaidCountEl.textContent = paidCount;
    if (this.summaryUnpaidCountEl) this.summaryUnpaidCountEl.textContent = unpaidCount;

    // Filter tab counter badges
    if (this.countAllEl) this.countAllEl.textContent = totalCount;
    if (this.countPaidEl) this.countPaidEl.textContent = paidCount;
    if (this.countUnpaidEl) this.countUnpaidEl.textContent = unpaidCount;
  }

  getFilteredStudents() {
    return this.students.filter((s) => {
      if (!s.isActive) return false;

      const p = this.payments.find(
        (pm) => pm.studentId === s.id && pm.monthYear === this.currentMonth
      );
      const isPaid = p ? p.isPaid : false;

      // Status Filter
      if (this.activeFilter === 'paid' && !isPaid) return false;
      if (this.activeFilter === 'unpaid' && isPaid) return false;

      // Subject Dropdown Filter
      if (this.selectedSubjectFilter && this.selectedSubjectFilter !== 'all') {
        const studentMods = Array.isArray(s.modules) ? s.modules : (s.module ? [s.module] : []);
        if (!studentMods.includes(this.selectedSubjectFilter)) return false;
      }

      // Search Query
      if (this.searchQuery) {
        const modulesStr = Array.isArray(s.modules) ? s.modules.join(' ') : (s.module || '');
        const text = `${s.firstName} ${s.lastName} ${modulesStr} ${s.grade} ${s.phone}`.toLowerCase();
        if (!text.includes(this.searchQuery)) return false;
      }

      return true;
    });
  }

  renderLists() {
    const filtered = this.getFilteredStudents();
    this.renderStudentCards(filtered);
    this.renderMonthlyTable(filtered);
  }

  renderStudentCards(filtered) {
    const container = this.studentListContainer;
    if (!container) return;
    container.innerHTML = '';

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="16"></line>
          </svg>
          <p>No students found matching your filters for this month.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((item) => {
      const p = this.payments.find(
        (pm) => pm.studentId === item.id && pm.monthYear === this.currentMonth
      );
      const isPaid = p ? p.isPaid : false;

      const modulesList = Array.isArray(item.modules)
        ? item.modules
        : (item.module ? [item.module] : ['General']);
      const badgesHtml = modulesList
        .map((m) => `<span class="subject-tag">${m}</span>`)
        .join('');

      const isAr = this.currentLang === 'ar';
      const swipeWrapper = document.createElement('div');
      swipeWrapper.className = 'swipe-container';
      swipeWrapper.dataset.studentId = item.id;

      swipeWrapper.innerHTML = `
        <div class="swipe-action-bg">
          <div class="swipe-delete-indicator">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>${isAr ? 'حذف' : 'Delete'}</span>
          </div>
        </div>
        <div class="student-card ${isPaid ? 'paid' : 'unpaid'} swipe-card">
          <div class="student-info">
            <div class="student-name-row">
              <span class="student-name">${item.firstName} ${item.lastName}</span>
            </div>
            <div class="student-subjects-chips">${badgesHtml}</div>
            <div class="student-meta">${isAr ? 'هاتف:' : 'Tel:'} ${item.phone}</div>
            <div class="student-meta">${isAr ? 'المستوى:' : 'Grade:'} ${item.grade}</div>
            <div class="student-fee">${isAr ? 'الرسوم:' : 'Fee:'} $${item.monthlyPrice.toFixed(2)}/${isAr ? 'شهر' : 'mo'}</div>
          </div>
          <div class="student-actions">
            <button class="edit-student-btn" title="Edit Student Info" data-id="${item.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="status-toggle-btn" title="Toggle Payment Status">
              ${isPaid ? (isAr ? 'مدفوع' : 'PAID') : (isAr ? 'غير مدفوع' : 'UNPAID')}
            </button>
          </div>
        </div>
      `;

      const card = swipeWrapper.querySelector('.swipe-card');
      const toggleBtn = swipeWrapper.querySelector('.status-toggle-btn');
      const editBtn = swipeWrapper.querySelector('.edit-student-btn');

      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePayment(item.id, item.monthlyPrice);
      });

      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openEditDialog(item.id);
      });

      this.attachSwipeGesture(card, swipeWrapper, item);

      container.appendChild(swipeWrapper);
    });
  }

  renderMonthlyTable(filtered) {
    if (!this.monthlyTableBody) return;
    this.monthlyTableBody.innerHTML = '';

    if (filtered.length === 0) {
      if (this.tableEmptyState) this.tableEmptyState.classList.remove('hidden');
      return;
    }

    if (this.tableEmptyState) this.tableEmptyState.classList.add('hidden');

    filtered.forEach((item) => {
      const p = this.payments.find(
        (pm) => pm.studentId === item.id && pm.monthYear === this.currentMonth
      );
      const isPaid = p ? p.isPaid : false;

      const modulesList = Array.isArray(item.modules)
        ? item.modules
        : (item.module ? [item.module] : ['General']);
      const badgesHtml = modulesList
        .map((m) => `<span class="subject-tag">${m}</span>`)
        .join('');

      const isAr = this.currentLang === 'ar';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="tbl-name">${item.firstName} ${item.lastName}</div>
          <div class="tbl-sub">${item.grade} • ${item.phone}</div>
        </td>
        <td>
          <div class="tbl-subjects">${badgesHtml}</div>
        </td>
        <td class="text-center">
          <button class="tbl-paid-toggle ${isPaid ? 'yes' : 'no'}" title="Click to toggle Paid/Unpaid for ${this.currentMonth}">
            ${isPaid ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
          </button>
        </td>
      `;

      const toggleBtn = tr.querySelector('.tbl-paid-toggle');
      toggleBtn.addEventListener('click', () => {
        this.togglePayment(item.id, item.monthlyPrice);
      });

      this.monthlyTableBody.appendChild(tr);
    });
  }

  attachSwipeGesture(card, wrapper, student) {
    let startX = 0;
    let currentDiff = 0;
    let isDragging = false;
    let isHorizontal = false;

    const onPointerDown = (e) => {
      if (e.target.closest('button')) return;
      startX = e.clientX;
      currentDiff = 0;
      isDragging = true;
      isHorizontal = false;
      card.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const diffX = e.clientX - startX;

      if (diffX < -5) {
        isHorizontal = true;
        card.classList.add('dragging');
      }

      if (isHorizontal) {
        currentDiff = Math.min(0, Math.max(-160, diffX));
        card.style.transform = `translateX(${currentDiff}px)`;
      }
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      card.classList.remove('dragging');
      try {
        card.releasePointerCapture(e.pointerId);
      } catch (_) { }

      if (currentDiff < -85) {
        card.style.transform = 'translateX(-120%)';
        wrapper.classList.add('deleting');
        setTimeout(() => {
          this.deleteStudent(student.id, `${student.firstName} ${student.lastName}`);
        }, 280);
      } else {
        card.style.transform = 'translateX(0px)';
      }
    };

    card.addEventListener('pointerdown', onPointerDown);
    card.addEventListener('pointermove', onPointerMove);
    card.addEventListener('pointerup', onPointerUp);
    card.addEventListener('pointercancel', onPointerUp);
  }

  renderInspector() {
    if (this.dbStudentCountEl) {
      this.dbStudentCountEl.textContent = this.students.length;
    }
    if (this.dbModuleCountEl) {
      this.dbModuleCountEl.textContent = this.modules.length;
    }
    if (this.dbPaymentCountEl) {
      this.dbPaymentCountEl.textContent = this.payments.length;
    }
    if (this.dbStudentsTableBody) {
      this.dbStudentsTableBody.innerHTML = '';
      this.students.forEach((s) => {
        const modulesStr = Array.isArray(s.modules) ? s.modules.join(', ') : (s.module || '');
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${s.firstName} ${s.lastName}</strong></td>
          <td>${s.phone}</td>
          <td><span class="subject-tag">${modulesStr}</span></td>
          <td>$${s.monthlyPrice}</td>
        `;
        this.dbStudentsTableBody.appendChild(tr);
      });
    }
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new StudentTrackerApp();
});
