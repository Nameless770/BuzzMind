/* BuzzMind i18n — English ⇄ Arabic, text-only (layout stays LTR).
   Translates by exact English UI text, so server-rendered AND
   client-rendered content both switch. Choice persists in localStorage. */
(function () {
  'use strict';
  if (window.__buzzI18n) return;

  // English UI text -> Arabic. Keys must match the on-screen text exactly (trimmed).
  var AR = {
    // ----- Navigation / sidebar / roles -----
    Home: 'الرئيسية',
    Library: 'المكتبة',
    Assignments: 'الواجبات',
    Reports: 'التقارير',
    Messages: 'الرسائل',
    Settings: 'الإعدادات',
    Classes: 'الفصول',
    'Quiz Builder': 'منشئ الاختبارات',
    Users: 'المستخدمون',
    Analytics: 'التحليلات',
    Professors: 'الأساتذة',
    'Sign Out': 'تسجيل الخروج',
    'Back to Home': 'العودة إلى الرئيسية',
    Dashboard: 'لوحة التحكم',
    Student: 'طالب',
    Professor: 'أستاذ',
    Management: 'الإدارة',
    student: 'طالب',
    professor: 'أستاذ',
    admin: 'مدير',

    // ----- Admin Pages -----
    'Professor Directory': 'دليل الأساتذة',
    'Create, edit and manage every faculty member.':
      'أنشئ وعدّل وأدِر كل عضو هيئة تدريس.',
    'Add Professor': 'إضافة أستاذ',
    'Active staff': 'الكادر النشط',
    'Classes taught': 'الفصول المُدرّسة',
    Departments: 'الأقسام',
    'Loading professors…': 'جارٍ تحميل الأساتذة…',
    'No professors found. Add one to get started.':
      'لم يتم العثور على أساتذة. أضف واحدًا للبدء.',
    'Accounts are created instantly. Share the generated password with the professor.':
      'يتم إنشاء الحسابات فورًا. شارك كلمة المرور المُولَّدة مع الأستاذ.',
    'Full name': 'الاسم الكامل',
    Email: 'البريد الإلكتروني',
    Department: 'القسم',
    Password: 'كلمة المرور',
    '(optional)': '(اختياري)',
    '(optional — auto-generated if blank)':
      '(اختياري — سيتم إنشاؤه تلقائيًا إذا ترك فارغًا)',
    'Edit Professor': 'تعديل الأستاذ',
    'Save changes': 'حفظ التغييرات',
    'Could not load professors.': 'تعذّر تحميل الأساتذة.',
    'Delete professor? This removes their account and related data.':
      'حذف الأستاذ؟ سيؤدي هذا إلى إزالة حسابه وبيانته ذات الصلة.',
    'removed.': 'تمت الإزالة.',
    'Class Management': 'إدارة الفصول',
    'Create classes, assign professors, enroll students and attach quizzes.':
      'أنشئ فصولاً وعيّن أساتذة وسجّل طلابًا وأرفق اختبارات.',
    'New Class': 'فصل جديد',
    'Loading classes…': 'جارٍ تحميل الفصول…',
    'No classes yet. Create one to get started.':
      'لا توجد فصول حتى الآن. أنشئ واحدًا للبدء.',
    'Create Class': 'إنشاء فصل',
    'Manage class': 'إدارة الفصل',
    'Manage button': 'زر الإدارة',
    Manage: 'إدارة',
    'Class name': 'اسم الفصل',
    Schedule: 'الجدول الزمني',
    Level: 'المستوى',
    'Select a professor…': 'اختر أستاذًا…',
    'Create class': 'إنشاء فصل',
    'Add student': 'إضافة طالب',
    'No students enrolled yet.': 'لم يتم تسجيل أي طلاب حتى الآن.',
    'Attached quizzes': 'الاختبارات المرفقة',
    'Select a quiz to attach…': 'اختر اختبارًا لإرفاقه…',
    Attach: 'إرفاق',
    'No quizzes attached.': 'لا توجد اختبارات مرفقة.',
    Assignments: 'الواجبات',
    'No assignments posted for this class.': 'لم تُنشَر أي واجبات لهذا الفصل.',
    'Could not open class': 'تعذّر فتح الفصل',
    'Delete class': 'حذف الفصل',
    'Could not delete class': 'تعذّر حذف الفصل',
    'User Management': 'إدارة المستخدمين',
    'Create and manage every professor, student and admin account.':
      'أنشئ وأدِر حساب كل أستاذ وطالب ومدير.',
    'Search name, email, username...':
      'ابحث بالاسم أو البريد أو اسم المستخدم...',
    'Add User': 'إضافة مستخدم',
    All: 'الكل',
    Students: 'الطلاب',
    Professors: 'الأساتذة',
    Admins: 'المديرون',
    Name: 'الاسم',
    Username: 'اسم المستخدم',
    Role: 'الدور',
    'Add / Edit modal': 'إضافة / تعديل',
    'Add User': 'إضافة مستخدم',
    'Create account': 'إنشاء حساب',
    'Edit User': 'تعديل المستخدم',
    'No users found.': 'لم يتم العثور على مستخدمين.',
    'Could not delete user': 'تعذّر حذف المستخدم',
    'Manage users': 'إدارة المستخدمين',
    'Manage classes': 'إدارة الفصول',
    'Manage students': 'إدارة الطلاب',
    'Manage professor': 'إدارة الأستاذ',
    'Manage assignments': 'إدارة الواجبات',
    Manage: 'إدارة',
    'Edit button': 'زر التعديل',
    'Delete button': 'زر الحذف',
    'View students': 'عرض الطلاب',
    'Edit class': 'تعديل الفصل',
    'Message Inbox': 'صندوق الرسائل',
    'Questions and requests sent from the contact form.':
      'الأسئلة والطلبات المرسلة من نموذج الاتصال.',
    Refresh: 'تحديث',
    Unread: 'غير مقروءة',
    Read: 'مقروءة',
    Archived: 'مؤرشفة',
    'No messages here.': 'لا توجد رسائل هنا.',
    'General inquiry': 'استفسار عام',
    'Mark read': 'وضع علامة مقروءة',
    'Mark unread': 'وضع علامة غير مقروءة',
    Archive: 'أرشفة',
    Unarchive: 'فك الأرشفة',
    Reply: 'رد',
    Delete: 'حذف',
    'Delete this message permanently?': 'حذف هذه الرسالة بشكل دائم؟',
    'Message deleted.': 'تم حذف الرسالة.',
    'Could not load messages': 'تعذّر تحميل الرسائل',
    'Action failed': 'فشل الإجراء',
    'Statistics & Analytics': 'الإحصائيات والتحليلات',
    'A live snapshot of activity across the whole platform.':
      'لقطة مباشرة من النشاط عبر المنصة بأكملها.',
    'Live sessions': 'الجلسات المباشرة',
    Submissions: 'التقديمات',
    'User roles': 'أدوار المستخدمين',
    'Loading…': 'جارٍ التحميل…',
    'Professors by department': 'الأساتذة حسب القسم',
    'Grade distribution': 'توزيع الدرجات',
    'Grading progress': 'تقدم التقييم',
    'Most played quizzes': 'الاختبارات الأكثر لعبًا',
    'Recent activity': 'النشاط الأخير',
    'No data yet.': 'لا توجد بيانات حتى الآن.',
    'No recent activity.': 'لا يوجد نشاط أخير.',
    'No quiz plays recorded.': 'لم يتم تسجيل أي لعب اختبارات.',
    'Could not load analytics': 'تعذّر تحميل التحليلات',
    'Student Overview': 'ملخص الطالب',
    'Full activity history for this student.':
      'السجل الكامل للنشاط لهذا الطالب.',
    Message: 'رسالة',
    'Loading student…': 'جارٍ تحميل الطالب…',
    'No student id provided.': 'لم يتم توفير معرّف الطالب.',
    'Failed to load student.': 'فشل تحميل الطالب.',
    'Quizzes played': 'اختبارات لُعبت',
    'Avg quiz accuracy': 'متوسط دقة الاختبار',
    'Enrolled classes': 'الفصول المسجلة',
    'Assignments & deadlines': 'الواجبات والمواعيد النهائية',
    'Not enrolled in any class.': 'غير مسجل في أي فصل.',
    'Quiz history': 'سجل الاختبارات',
    'No assignments.': 'لا توجد واجبات.',
    'No quiz attempts.': 'لا توجد محاولات اختبار.',
    Missed: 'فائت',
    'Not submitted': 'لم تُرسَل',
    Submitted: 'مُرسَل',
    late: 'متأخر',
    'Professor Overview': 'ملخص الأستاذ',
    'Everything this professor has built and run.':
      'كل ما بناه وشغّله هذا الأستاذ.',
    Email: 'البريد الإلكتروني',
    'Loading professor…': 'جارٍ تحميل الأستاذ…',
    'No professor id provided.': 'لم يتم توفير معرّف الأستاذ.',
    'Failed to load professor.': 'فشل تحميل الأستاذ.',
    Classes: 'الفصول',
    'Students taught': 'الطلاب الذين درّستهم',
    Quizzes: 'الاختبارات',
    'Game sessions': 'جلسات اللعب',
    Questions: 'الأسئلة',
    Created: 'تم الإنشاء',
    'No classes.': 'لا توجد فصول.',
    'No quizzes.': 'لا توجد اختبارات.',
    'No game sessions.': 'لا توجد جلسات لعب.',

    // ----- Library & Assignments & Messages -----
    'Every quiz you have played, in one collection.':
      'كل اختبار لعبته في مجموعة واحدة.',
    'My Assignments': 'واجباتي',
    'Everything due across your classes, in one place.':
      'كل ما يستحق العودة إليه عبر فصولك في مكان واحد.',
    'To do': 'قيد الانتظار',
    Submitted: 'مُرسَل',
    Graded: 'مُقيَّم',
    Missed: 'فائت',
    All: 'الكل',
    'Chat with your professors.': 'تحدث مع أساتذتك.',
    'No messages yet': 'لا توجد رسائل حتى الآن',
    'Select a conversation': 'اختر محادثة',
    ACCURACY: 'الدقة',
    'Total points': 'إجمالي النقاط',
    'Avg. accuracy': 'متوسط الدقة',
    PLAYED: 'لُعب',
    Due: 'موعد',
    'No due date': 'لا يوجد موعد نهائي',
    questions: 'أسئلة',
    pts: 'ن',
    'Search your quizzes...': 'ابحث عن اختباراتك...',
    'No quizzes match your search.': 'لا توجد اختبارات تطابق بحثك.',
    "You haven't played any quizzes yet. Join a live game from Discover.":
      'لم تلعب أي اختبارات حتى الآن. انضم إلى لعبة مباشرة من اكتشف.',
    'Could not load your quizzes.': 'تعذّر تحميل اختباراتك.',
    'Performance Reports': 'تقارير الأداء',
    'A deep dive into how you have done across every quiz.':
      'فحص عميق لكيفية أدائك عبر كل اختبار.',
    'Quizzes taken': 'الاختبارات المُجراة',
    'Best score': 'أفضل نتيجة',
    '+ New Class': 'فصل جديد +',
    students: 'طلاب',
    Quiz: 'اختبار',
    Date: 'التاريخ',
    Questions: 'الأسئلة',
    Accuracy: 'الدقة',
    Score: 'النتيجة',
    'Could not load reports.': 'تعذّر تحميل التقارير.',
    'WAITING FOR PROFESSOR TO START...': 'انتظر بدء الأستاذ...',
    'GAME PIN': 'رمز اللعبة',
    'Players Joined': 'لاعبون انضموا',
    'Only your professor can start the quiz.': 'فقط أستاذك يمكنه بدء الاختبار.',
    'QUIZ STARTED': 'بدأ الاختبار',
    'SESSION NOT FOUND': 'الجلسة غير موجودة',
    'No quiz results yet. Play a game from Discover to see your performance here.':
      'لم تكن هناك نتائج اختبار حتى الآن. العب لعبة من القسم اكتشف لترى أدائك هنا.',

    // ----- Admin Pages -----
    'No professors found. Add one to get started.':
      'لم يتم العثور على أساتذة. أضف واحدًا للبدء.',
    Email: 'البريد الإلكتروني',
    Password: 'كلمة المرور',
    '(optional)': '(اختياري)',
    '(optional — auto-generated if blank)':
      '(اختياري — سيتم إنشاؤه تلقائيًا إذا ترك فارغًا)',
    'Could not load professors.': 'تعذّر تحميل الأساتذة.',
    'Delete professor? This removes their account and related data.':
      'حذف الأستاذ؟ سيؤدي هذا إلى إزالة حسابه وبيانته ذات الصلة.',
    'removed.': 'تمت الإزالة.',
    'Class Management': 'إدارة الفصول',
    'Create classes, assign professors, enroll students and attach quizzes.':
      'أنشئ فصولاً وعيّن أساتذة وسجّل طلابًا وأرفق اختبارات.',
    'New Class': 'فصل جديد',
    'Loading classes…': 'جارٍ تحميل الفصول…',
    'No classes yet. Create one to get started.':
      'لا توجد فصول حتى الآن. أنشئ واحدًا للبدء.',
    'Assign a professor who will own and teach this class.':
      'عيّن أستاذًا سيمتلك ويدرّس هذا الفصل.',
    'Class name': 'اسم الفصل',
    Schedule: 'الجدول الزمني',
    Level: 'المستوى',
    'Select a professor…': 'اختر أستاذًا…',
    'Create class': 'إنشاء فصل',
    'Add student': 'إضافة طالب',
    'No students enrolled yet.': 'لم يتم تسجيل أي طلاب حتى الآن.',
    'Attached quizzes': 'الاختبارات المرفقة',
    'Select a quiz to attach…': 'اختر اختبارًا لإرفاقه…',
    Attach: 'إرفاق',
    'No quizzes attached.': 'لا توجد اختبارات مرفقة.',
    'No assignments posted for this class.': 'لم تُنشَر أي واجبات لهذا الفصل.',
    'Could not open class': 'تعذّر فتح الفصل',
    'Delete class': 'حذف الفصل',
    'Could not delete class': 'تعذّر حذف الفصل',
    'User Management': 'إدارة المستخدمين',
    'Create and manage every professor, student and admin account.':
      'أنشئ وأدِر حساب كل أستاذ وطالب ومدير.',
    'Search name, email, username...':
      'ابحث بالاسم أو البريد أو اسم المستخدم...',
    'Add User': 'إضافة مستخدم',
    Students: 'الطلاب',
    Professors: 'الأساتذة',
    Admins: 'المديرون',
    Name: 'الاسم',
    Username: 'اسم المستخدم',
    Role: 'الدور',
    'Add / Edit modal': 'إضافة / تعديل',
    'Add User': 'إضافة مستخدم',
    'Create account': 'إنشاء حساب',
    'Edit User': 'تعديل المستخدم',
    'Save changes': 'حفظ التغييرات',
    'No users found.': 'لم يتم العثور على مستخدمين.',
    'Could not delete user': 'تعذّر حذف المستخدم',
    'Manage users': 'إدارة المستخدمين',
    'Manage classes': 'إدارة الفصول',
    'Manage students': 'إدارة الطلاب',
    'Message Inbox': 'صندوق الرسائل',
    'Questions and requests sent from the contact form.':
      'الأسئلة والطلبات المرسلة من نموذج الاتصال.',
    Refresh: 'تحديث',
    Unread: 'غير مقروءة',
    Read: 'مقروءة',
    Archived: 'مؤرشفة',
    'No messages here.': 'لا توجد رسائل هنا.',
    'General inquiry': 'استفسار عام',
    'Mark read': 'وضع علامة مقروءة',
    'Mark unread': 'وضع علامة غير مقروءة',
    Archive: 'أرشفة',
    Unarchive: 'فك الأرشفة',
    Reply: 'رد',
    Delete: 'حذف',
    'Delete this message permanently?': 'حذف هذه الرسالة بشكل دائم؟',
    'Message deleted.': 'تم حذف الرسالة.',
    'Could not load messages': 'تعذّر تحميل الرسائل',
    'Action failed': 'فشل الإجراء',
    'Statistics & Analytics': 'الإحصائيات والتحليلات',
    'A live snapshot of activity across the whole platform.':
      'لقطة مباشرة من النشاط عبر المنصة بأكملها.',
    'Live sessions': 'الجلسات المباشرة',
    'User roles': 'أدوار المستخدمين',
    'Professors by department': 'الأساتذة حسب القسم',
    'Grade distribution': 'توزيع الدرجات',
    'Grading progress': 'تقدم التقييم',
    'Most played quizzes': 'الاختبارات الأكثر لعبًا',
    'Recent activity': 'النشاط الأخير',
    'No data yet.': 'لا توجد بيانات حتى الآن.',
    'No recent activity.': 'لا يوجد نشاط أخير.',
    'No quiz plays recorded.': 'لم يتم تسجيل أي لعب اختبارات.',
    'Could not load analytics': 'تعذّر تحميل التحليلات',
    'Student Overview': 'ملخص الطالب',
    'Full activity history for this student.':
      'السجل الكامل للنشاط لهذا الطالب.',
    Message: 'رسالة',
    'Loading student…': 'جارٍ تحميل الطالب…',
    'No student id provided.': 'لم يتم توفير معرّف الطالب.',
    'Failed to load student.': 'فشل تحميل الطالب.',
    'Avg quiz accuracy': 'متوسط دقة الاختبار',
    'Enrolled classes': 'الفصول المسجلة',
    'Assignments & deadlines': 'الواجبات والمواعيد النهائية',
    'Not enrolled in any class.': 'غير مسجل في أي فصل.',
    'No quiz attempts.': 'لا توجد محاولات اختبار.',
    'Not submitted': 'لم تُرسَل',
    late: 'متأخر',
    'Professor Overview': 'ملخص الأستاذ',
    'Everything this professor has built and run.':
      'كل ما بناه وشغّله هذا الأستاذ.',
    'Loading professor…': 'جارٍ تحميل الأستاذ…',
    'No professor id provided.': 'لم يتم توفير معرّف الأستاذ.',
    'Failed to load professor.': 'فشل تحميل الأستاذ.',
    'Students taught': 'الطلاب الذين درّستهم',
    'Game sessions': 'جلسات اللعب',

    // ----- Professor Pages -----
    'My Classrooms': 'فصولي الدراسية',
    'Manage your currently running semesters and curricula.':
      'أدِر الفصول الدراسية والمناهج الجارية حاليًا.',
    'Search classes...': 'ابحث عن الفصول...',
    'Create Quiz': 'إنشاء اختبار',
    'Active classes': 'الفصول النشطة',
    Levels: 'المستويات',
    'Add a new classroom to your dashboard.':
      'أضف فصلاً جديدًا إلى لوحة تحكمك.',
    'Could not create class.': 'تعذّر إنشاء الفصل.',
    'Could not delete class.': 'تعذّر حذف الفصل.',
    'CURRENT CLASS': 'الفصل الحالي',
    Myclasses: 'فصولي',
    'CLASS AVERAGE': 'متوسط الفصل',
    '%': '%',
    'Student Roster': 'قائمة الطلاب',
    Enrolled: 'مسجلون',
    'STUDENT INFORMATION': 'معلومات الطالب',
    'AVERAGE GRADE': 'متوسط الدرجة',
    PARTICIPATION: 'المشاركة',
    ACTIONS: 'الإجراءات',
    SHOWING: 'عرض',
    OF: 'من',
    STUDENTS: 'الطلاب',
    'Search student by name...': 'ابحث عن طالب بالاسم...',
    'Add Student': 'إضافة طالب',
    'Add New Student': 'إضافة طالب جديد',
    'Invalid name': 'اسم غير صالح',
    'Invalid email': 'بريد إلكتروني غير صالح',
    'Post text, Word or PDF assignments and grade what comes back.':
      'انشر النصوص أو الواجبات بصيغة Word أو PDF وصنّف ما يعود.',
    'New Assignment': 'واجب جديد',
    'Loading assignments…': 'جارٍ تحميل الواجبات…',
    'No assignments yet. Create your first one.':
      'لا توجد واجبات حتى الآن. أنشئ واجبتك الأولى.',
    'Students in the selected class will see this immediately.':
      'سيرى الطلاب في الفصل المختار هذا على الفور.',
    Title: 'العنوان',
    Instructions: 'التعليمات',
    'Submission type': 'نوع التقديم',
    'Text or file': 'نص أو ملف',
    'Text only': 'نص فقط',
    'File only': 'ملف فقط',
    Points: 'النقاط',
    'Due date': 'تاريخ الاستحقاق',
    Attachments: 'المرفقات',
    '(brief, rubric, PDF/Word — optional)':
      '(موجز، معايير، PDF/Word — اختياري)',
    'Create assignment': 'إنشاء واجب',
    'Edit Assignment': 'تعديل الواجب',
    'Save changes': 'حفظ التغييرات',
    'Add text or attach a file before submitting.':
      'أضف نصًا أو أرفق ملفًا قبل التقديم.',
    'Work submitted.': 'تم تقديم العمل.',
    'Could not submit.': 'تعذّر التقديم.',
    Submissions: 'التقديمات',
    'Chat with the students in your classes.': 'تحدث مع الطلاب في فصولك.',
    'Pick someone on the left to start chatting.':
      'اختر شخصًا على اليسار لبدء الدردشة.',
    'Type a message…': 'اكتب رسالة…',
    Send: 'إرسال',
    'Quiz Builder': 'منشئ الاختبارات',
    'Design an interactive quiz, then save it or launch it live for your students.':
      'صمّم اختبارًا تفاعليًا، ثم احفظه أو أطلقه مباشرة لطلابك.',
    'Save Draft': 'حفظ المسودة',
    'Launch Quiz': 'إطلاق الاختبار',
    'Quiz title': 'عنوان الاختبار',
    "e.g. Newton's Laws of Motion": 'مثال: قوانين نيوتن للحركة',
    'Total time (min)': 'الوقت الإجمالي (دقيقة)',
    'Import from Open Trivia DB': 'استيراد من قاعدة بيانات Open Trivia',
    'Pull ready-made multiple-choice questions from an external question bank.':
      'اسحب الأسئلة متعددة الخيارات الجاهزة من بنك أسئلة خارجي.',
    Difficulty: 'مستوى الصعوبة',
    Any: 'أي',
    Easy: 'سهل',
    Medium: 'متوسط',
    Hard: 'صعب',
    Import: 'استيراد',
    'Add Question': 'إضافة سؤال',

    // ----- Common Actions -----
    Cancel: 'إلغاء',
    Confirm: 'تأكيد',
    Save: 'حفظ',
    Edit: 'تعديل',
    View: 'عرض',
    Search: 'بحث',
    Filter: 'تصفية',
    'Loading…': 'جارٍ التحميل…',
    'No results found': 'لم يتم العثور على نتائج',
    'Enter your name': 'أدخل اسمك',
    'Enter your email': 'أدخل بريدك الإلكتروني',
    'Enter current password': 'أدخل كلمة المرور الحالية',
    'Enter new password': 'أدخل كلمة المرور الجديدة',
    'Log in': 'تسجيل الدخول',
    Login: 'تسجيل الدخول',
    Logout: 'تسجيل الخروج',
    'Sign up': 'إنشاء حساب',
    'Sign Up': 'إنشاء حساب',
    'Sign up free': 'أنشئ حسابًا مجانًا',
    'Go to Dashboard': 'الذهاب إلى لوحة التحكم',
    'Hi,': 'مرحبًا،',
    'Level Up Your': 'طوّر',
    'Learning!': 'تعلّمك!',
    'Turn every classroom into a game. Interactive quizzes that make learning feel like winning.':
      'حوّل كل فصل دراسي إلى لعبة. اختبارات تفاعلية تجعل التعلّم يبدو وكأنه فوز.',
    'How We Play': 'كيف نلعب',
    'The Game Plan': 'خطة اللعب',
    'Quest Library': 'مكتبة المهام',
    'Explore thousands of teacher-made quizzes across every subject imaginable. Your next adventure starts here.':
      'استكشف آلاف الاختبارات التي أعدّها المعلمون في كل المواد التي يمكن تخيّلها. مغامرتك التالية تبدأ هنا.',
    'Real-time Stats': 'إحصائيات فورية',
    'Watch progress happen live with kinetic charts. Get instant feedback and celebrate every milestone in high definition.':
      'تابع التقدّم مباشرةً عبر رسوم بيانية حيّة. احصل على تغذية راجعة فورية واحتفِ بكل إنجاز بدقّة عالية.',
    'Group Power': 'قوة المجموعة',
    'Collaborate with classmates in Squad Mode. Victory is sweeter when the whole team levels up together.':
      'تعاون مع زملائك في وضع الفريق. النصر أحلى عندما يتطوّر الفريق بأكمله معًا.',
    'Ready to Transform Your Classroom?': 'هل أنت مستعد لتطوير فصلك الدراسي؟',
    'Join thousands of educators and students already leveling up their learning experience.':
      'انضم إلى آلاف المعلمين والطلاب الذين يطوّرون تجربتهم التعليمية بالفعل.',
    'Sign up as a Student': 'سجّل كطالب',
    'Sign up as a Professor': 'سجّل كأستاذ',
    '© 2026 BuzzMind. Level Up Your Learning!': '© 2026 BuzzMind. طوّر تعلّمك!',
    'Empowering learners and educators through kinetic, high-energy play.':
      'نُمكّن المتعلمين والمعلمين عبر اللعب الحيوي عالي الطاقة.',
    '© 2026 BuzzMind. All rights reserved.':
      '© 2026 BuzzMind. جميع الحقوق محفوظة.',

    // ----- Login / register -----
    'Create Your Account': 'أنشئ حسابك',
    'Join the BuzzMind community today.': 'انضم إلى مجتمع BuzzMind اليوم.',
    'Full Name': 'الاسم الكامل',
    Username: 'اسم المستخدم',
    'Email Address': 'البريد الإلكتروني',
    Password: 'كلمة المرور',
    'Create Account': 'إنشاء حساب',
    'Login to Your Account': 'تسجيل الدخول إلى حسابك',
    'Welcome back to BuzzMind.': 'مرحبًا بعودتك إلى BuzzMind.',
    'Email or Username': 'البريد الإلكتروني أو اسم المستخدم',
    'That email is already registered.': 'هذا البريد الإلكتروني مسجّل بالفعل.',
    'That username is already taken.': 'اسم المستخدم هذا مستخدَم بالفعل.',
    'Email or username already exists.':
      'البريد الإلكتروني أو اسم المستخدم موجود بالفعل.',
    'No account found with that email or username.':
      'لا يوجد حساب بهذا البريد الإلكتروني أو اسم المستخدم.',
    'Incorrect password.': 'كلمة المرور غير صحيحة.',
    'Invalid email/username or password.':
      'بريد إلكتروني/اسم مستخدم أو كلمة مرور غير صحيحة.',
    'Please fill in all sign-up fields.': 'يرجى ملء جميع حقول التسجيل.',
    'Something went wrong. Please try again.':
      'حدث خطأ ما. يرجى المحاولة مرة أخرى.',

    // ----- Role picker -----
    'Pick Your': 'اختر',
    'Power!': 'قوتك!',
    'Ready to start the game? Choose the role that fits your mission today.':
      'مستعد لبدء اللعبة؟ اختر الدور الذي يناسب مهمتك اليوم.',
    'Create and manage quizzes, track student progress':
      'أنشئ الاختبارات وأدِرها وتابع تقدّم الطلاب',
    'Take quizzes, view results, learn and grow':
      'خُض الاختبارات، واطّلع على النتائج، وتعلّم وتطوّر',
    'Continue Journey': 'تابع الرحلة',
    'CHOOSE A ROLE TO UNLOCK THE NEXT LEVEL': 'اختر دورًا لفتح المستوى التالي',
    'Please choose a valid role before continuing.':
      'يرجى اختيار دور صالح قبل المتابعة.',

    // ----- Contact -----
    'Get in touch': 'تواصل معنا',
    'Questions, problems or feedback? Send the admin team a message.':
      'أسئلة أو مشكلات أو ملاحظات؟ أرسل رسالة إلى فريق الإدارة.',
    Name: 'الاسم',
    Email: 'البريد الإلكتروني',
    Subject: 'الموضوع',
    Message: 'الرسالة',
    'Send message': 'إرسال الرسالة',
    'Sending…': 'جارٍ الإرسال…',
    'Your name': 'اسمك',
    'What is this about?': 'ما موضوع رسالتك؟',
    'Tell us what you need…': 'أخبرنا بما تحتاجه…',

    // ----- Settings -----
    'Account settings': 'إعدادات الحساب',
    'Display name': 'الاسم المعروض',
    'Email address': 'البريد الإلكتروني',
    'Username / ID': 'اسم المستخدم / المعرّف',
    'Save changes': 'حفظ التغييرات',
    'Security & password': 'الأمان وكلمة المرور',
    'Current password': 'كلمة المرور الحالية',
    'New password': 'كلمة المرور الجديدة',
    'Confirm new password': 'تأكيد كلمة المرور الجديدة',
    'Update password': 'تحديث كلمة المرور',
    'Enter your name': 'أدخل اسمك',
    'Enter your email': 'أدخل بريدك الإلكتروني',
    'Enter current password': 'أدخل كلمة المرور الحالية',
    'Enter new password': 'أدخل كلمة المرور الجديدة',

    // ----- Dashboards (common) -----
    Discover: 'اكتشف',
    'Join a live game and play with your class.':
      'انضم إلى لعبة مباشرة والعب مع فصلك.',
    'The fun way to': 'الطريقة الممتعة لـ',
    learn: 'التعلّم',
    and: 'و',
    'play!': 'اللعب!',
    'Host a game, challenge your friends, and master any subject.':
      'استضِف لعبة، وتحدَّ أصدقاءك، وأتقِن أي مادة.',
    'Game PIN': 'رمز اللعبة',
    'Join Game': 'انضم للعبة',
    'Ask your host for the game PIN to join.':
      'اطلب رمز اللعبة من المضيف للانضمام.',
    'Professor Directory': 'دليل الأساتذة',
    'Create, edit and manage every faculty member.':
      'أنشئ كل عضو هيئة تدريس وعدّله وأدِره.',
    'Add Professor': 'إضافة أستاذ',
    'Edit Professor': 'تعديل الأستاذ',
    'Active staff': 'الكادر النشط',
    'Total students': 'إجمالي الطلاب',
    'Classes taught': 'الفصول المُدرّسة',
    Departments: 'الأقسام',
    'Loading professors…': 'جارٍ تحميل الأساتذة…',
    'Full name': 'الاسم الكامل',
    Department: 'القسم',
    Cancel: 'إلغاء',
    View: 'عرض',
    Edit: 'تعديل',
    'Search name, email, department...': 'ابحث بالاسم أو البريد أو القسم...',
    'Accounts are created instantly. Share the generated password with the professor.':
      'يتم إنشاء الحسابات فورًا. شارك كلمة المرور المُولَّدة مع الأستاذ.',

    // ----- Marketing nav + footer -----
    About: 'من نحن',
    Pricing: 'الأسعار',
    Contact: 'تواصل معنا',
    Privacy: 'الخصوصية',
    Company: 'الشركة',
    'Get started': 'ابدأ الآن',
    'Privacy & Policy': 'الخصوصية والسياسة',

    // ----- About page -----
    'Our story': 'قصتنا',
    'We make learning feel like': 'نجعل التعلّم يبدو وكأنه',
    play: 'لعب',
    'BuzzMind turns every classroom into a high-energy game show. We help professors create interactive quizzes and help students learn faster by actually having fun.':
      'يحوّل BuzzMind كل فصل دراسي إلى برنامج ألعاب مفعم بالحيوية. نساعد الأساتذة على إنشاء اختبارات تفاعلية ونساعد الطلاب على التعلّم بشكل أسرع عبر الاستمتاع فعلاً.',
    'Why we built BuzzMind': 'لماذا أنشأنا BuzzMind',
    'Lectures are easy to forget. Games are hard to forget. We built BuzzMind so educators can harness that energy — live quizzes, instant feedback, and friendly competition that keeps every student engaged from the first question to the last.':
      'من السهل نسيان المحاضرات، أما الألعاب فيصعب نسيانها. أنشأنا BuzzMind ليتمكّن المعلمون من تسخير تلك الطاقة — اختبارات مباشرة، وتغذية راجعة فورية، ومنافسة ودّية تُبقي كل طالب متفاعلاً من السؤال الأول حتى الأخير.',
    'Play to learn': 'العب لتتعلّم',
    'Points, streaks, and live leaderboards turn revision into a game students want to win.':
      'النقاط والسلاسل ولوحات الصدارة المباشرة تحوّل المراجعة إلى لعبة يريد الطلاب الفوز بها.',
    'Built for classrooms': 'مصمّم للفصول الدراسية',
    'Designed with real professors so it fits how you actually teach, assess, and track progress.':
      'صُمّم بمشاركة أساتذة حقيقيين ليناسب طريقتك الفعلية في التدريس والتقييم وتتبّع التقدّم.',
    'Insightful by design': 'تحليلات مدمجة بالتصميم',
    'Every game produces clear reports, so you know exactly who needs help and where.':
      'كل لعبة تُنتج تقارير واضحة، لتعرف بدقّة من يحتاج إلى مساعدة وأين.',
    'Quizzes played': 'اختبارات لُعبت',
    Classrooms: 'الفصول الدراسية',
    'Questions answered': 'أسئلة تمت الإجابة عنها',
    'Teacher satisfaction': 'رضا المعلمين',
    'Ready to join the fun?': 'مستعد للانضمام إلى المرح؟',
    'Create your free account and run your first live quiz in minutes.':
      'أنشئ حسابك المجاني وأطلِق أول اختبار مباشر لك في دقائق.',
    'See pricing': 'اطّلع على الأسعار',

    // ----- Privacy page -----
    Legal: 'قانوني',
    'Privacy &': 'الخصوصية و',
    Policy: 'السياسة',
    'Your privacy matters to us. This page explains what we collect, why we collect it, and the choices you have.':
      'خصوصيتك تهمّنا. توضّح هذه الصفحة ما نجمعه ولماذا نجمعه والخيارات المتاحة لك.',
    'Last updated: June 1, 2026': 'آخر تحديث: 1 يونيو 2026',
    'Information we collect': 'المعلومات التي نجمعها',
    'When you create an account we collect the name, username, and email address you provide. As you use BuzzMind we also store the quizzes, classes, assignments, and game results needed to run the platform.':
      'عند إنشاء حساب نجمع الاسم واسم المستخدم والبريد الإلكتروني الذي تقدّمه. وأثناء استخدامك BuzzMind نخزّن أيضًا الاختبارات والفصول والواجبات ونتائج الألعاب اللازمة لتشغيل المنصة.',
    'How we use your data': 'كيف نستخدم بياناتك',
    'We use your information to operate the service, personalize your dashboard, show your progress, and improve our quizzes and features. We do not use your data to build advertising profiles.':
      'نستخدم معلوماتك لتشغيل الخدمة وتخصيص لوحة تحكمك وعرض تقدّمك وتحسين اختباراتنا وميزاتنا. لا نستخدم بياناتك لبناء ملفات إعلانية.',
    'Cookies & sessions': 'ملفات تعريف الارتباط والجلسات',
    'We use a single session cookie to keep you signed in securely. We do not use third-party advertising or cross-site tracking cookies.':
      'نستخدم ملف تعريف ارتباط واحدًا للجلسة لإبقائك مسجّل الدخول بأمان. لا نستخدم ملفات تتبّع إعلانية تابعة لجهات خارجية أو عبر المواقع.',
    'How we share information': 'كيف نشارك المعلومات',
    'We never sell your personal data. Information is shared only in these limited cases:':
      'لا نبيع بياناتك الشخصية أبدًا. تتم مشاركة المعلومات فقط في هذه الحالات المحدودة:',
    'With your professors or institution, to deliver classes and grades.':
      'مع أساتذتك أو مؤسستك، لتقديم الفصول والدرجات.',
    'With trusted service providers that host the platform on our behalf.':
      'مع مزوّدي خدمات موثوقين يستضيفون المنصة نيابةً عنا.',
    'When required by law or to protect the safety of our users.':
      'عندما يقتضي القانون ذلك أو لحماية سلامة مستخدمينا.',
    'Your rights': 'حقوقك',
    'You can view, edit, or delete your account information at any time from your settings page. You may also contact us to request a copy of your data or to close your account.':
      'يمكنك عرض معلومات حسابك أو تعديلها أو حذفها في أي وقت من صفحة الإعدادات. كما يمكنك التواصل معنا لطلب نسخة من بياناتك أو لإغلاق حسابك.',
    'Data security': 'أمن البيانات',
    'Passwords are stored using strong one-way hashing, and access to personal data is restricted to authorized staff. No system is perfectly secure, but we work hard to protect your information.':
      'تُخزَّن كلمات المرور باستخدام تجزئة قوية أحادية الاتجاه، والوصول إلى البيانات الشخصية مقصور على الموظفين المصرّح لهم. لا يوجد نظام آمن تمامًا، لكننا نعمل بجدّ لحماية معلوماتك.',
    'Questions about this policy?': 'أسئلة حول هذه السياسة؟',
    'If you have any questions about how we handle your data, we are happy to help.':
      'إذا كان لديك أي أسئلة حول كيفية تعاملنا مع بياناتك، فيسعدنا مساعدتك.',
    'Contact our team': 'تواصل مع فريقنا',

    // ----- Pricing page -----
    'For professors': 'للأساتذة',
    'Plans that grow with your': 'خطط تنمو مع',
    classroom: 'فصلك الدراسي',
    'Start free, upgrade when your classes get bigger, and cancel anytime. Every plan includes live games, quizzes, and leaderboards.':
      'ابدأ مجانًا، وارتقِ بالخطة عندما تكبر فصولك، وألغِ في أي وقت. تتضمّن كل خطة ألعابًا مباشرة واختبارات ولوحات صدارة.',
    Monthly: 'شهري',
    Annual: 'سنوي',
    'Save 20%': 'وفّر 20%',
    Starter: 'المبتدئ',
    'For trying things out and small classes.':
      'لتجربة المنصة والفصول الصغيرة.',
    '/mo': '/شهر',
    'Free forever': 'مجاني للأبد',
    'Up to 2 classes': 'حتى فصلين',
    'Up to 50 students': 'حتى 50 طالبًا',
    'Core quiz builder': 'منشئ الاختبارات الأساسي',
    'Live games & PINs': 'ألعاب مباشرة ورموز دخول',
    'Community support': 'دعم المجتمع',
    'Get started free': 'ابدأ مجانًا',
    'Most popular': 'الأكثر شيوعًا',
    Pro: 'برو',
    'For active educators running regular live quizzes.':
      'للمعلمين النشطين الذين يديرون اختبارات مباشرة بانتظام.',
    'Billed monthly': 'يُدفع شهريًا',
    'Billed annually': 'يُدفع سنويًا',
    'Unlimited classes': 'فصول غير محدودة',
    'Up to 500 students': 'حتى 500 طالب',
    'Quiz library & AI import': 'مكتبة اختبارات واستيراد بالذكاء الاصطناعي',
    'Reports & analytics': 'التقارير والتحليلات',
    'Assignments & grading': 'الواجبات والتقييم',
    'Priority email support': 'دعم بريد إلكتروني ذو أولوية',
    'Choose Pro': 'اختر برو',
    Campus: 'الحرم الجامعي',
    'For departments and whole schools.': 'للأقسام والمدارس بأكملها.',
    'Everything in Pro': 'كل ما في برو',
    'Unlimited students': 'طلاب غير محدودين',
    'Admin dashboard': 'لوحة تحكم المدير',
    'Custom branding': 'علامة تجارية مخصصة',
    'Onboarding & training': 'الإعداد والتدريب',
    'Dedicated support': 'دعم مخصص',
    'Contact sales': 'تواصل مع المبيعات',
    "These prices are for preview only — online billing isn't connected yet. Pick a plan and our team will set you up.":
      'هذه الأسعار للعرض فقط — لم يتم ربط الدفع الإلكتروني بعد. اختر خطة وسيتولّى فريقنا إعدادك.',
    'Still deciding?': 'ما زلت تفكر؟',
    "Start on the free Starter plan today — no card required — and upgrade whenever you're ready.":
      'ابدأ اليوم بخطة المبتدئ المجانية — دون الحاجة إلى بطاقة — وارتقِ متى كنت مستعدًا.',
    'Create free account': 'أنشئ حسابًا مجانيًا',
    'Talk to us': 'تحدّث إلينا',

    // ----- Contact page -----
    'Get in': 'تواصل',
    touch: 'معنا',
    "Questions, problems, or feedback? Send our admin team a message and we'll get back to you.":
      'أسئلة أو مشكلات أو ملاحظات؟ أرسل رسالة إلى فريق الإدارة وسنعاود التواصل معك.',
    "We'd love to hear from you": 'يسعدنا أن نسمع منك',
    "Whether you're a professor sizing up a plan or a student who hit a snag, drop us a note. Your message goes straight to the BuzzMind admin inbox.":
      'سواء كنت أستاذًا يقيّم خطة أو طالبًا واجه مشكلة، أرسل لنا رسالة. تصل رسالتك مباشرة إلى صندوق وارد إدارة BuzzMind.',
    'Send a message': 'أرسل رسالة',
    'The form below reaches our admin team directly.':
      'يصل النموذج أدناه إلى فريق الإدارة مباشرة.',
    'Response time': 'وقت الاستجابة',
    'We usually reply within one business day.':
      'نردّ عادةً خلال يوم عمل واحد.',
    'Anything goes': 'كل شيء مرحّب به',
    'Account, billing, or quiz questions are all welcome.':
      'أسئلة الحساب أو الفوترة أو الاختبارات، جميعها مرحّب بها.',
    'Name, email and message are required.':
      'الاسم والبريد الإلكتروني والرسالة مطلوبة.',
    'Message sent! The admin team will get back to you.':
      'تم إرسال الرسالة! سيتواصل معك فريق الإدارة.',
    'Not signed in? You can still send a message.':
      'لست مسجّلاً الدخول؟ لا يزال بإمكانك إرسال رسالة.',
    'Could not send your message.': 'تعذّر إرسال رسالتك.',
    'Signed in as': 'مُسجّل الدخول باسم',
  };

  var KEY = 'bm_lang';
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };
  var ATTRS = ['placeholder', 'title', 'aria-label'];
  var GLOBE =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>';

  var seenText = new Map(); // textNode -> original English
  var seenAttr = new Map(); // element -> { attr: originalValue }
  var observer = null;

  function getLang() {
    try {
      return localStorage.getItem(KEY) || 'en';
    } catch (e) {
      return 'en';
    }
  }
  function storeLang(l) {
    try {
      localStorage.setItem(KEY, l);
    } catch (e) {}
  }

  function skip(node) {
    var p = node.parentNode;
    while (p && p.nodeType === 1) {
      if (SKIP[p.tagName]) return true;
      if (p.hasAttribute && p.hasAttribute('data-no-i18n')) return true;
      if (p.isContentEditable) return true;
      p = p.parentNode;
    }
    return false;
  }

  function translateText(node) {
    var raw = node.nodeValue;
    if (!raw || seenText.has(node)) return;
    var t = raw.trim();
    if (!t || skip(node)) return;
    // Match exact text first; fall back to whitespace-collapsed text so that
    // paragraphs wrapped across multiple source lines still match the keys.
    var key = AR.hasOwnProperty(t) ? t : null;
    if (!key) {
      var norm = t.replace(/\s+/g, ' ');
      if (norm !== t && AR.hasOwnProperty(norm)) key = norm;
    }
    if (!key) return;
    var lead = raw.slice(0, raw.length - raw.replace(/^\s+/, '').length);
    var trail = raw.slice(raw.replace(/\s+$/, '').length);
    seenText.set(node, raw);
    node.nodeValue = lead + AR[key] + trail;
  }

  function translateAttrs(el) {
    if (!el || el.nodeType !== 1) return;
    if (el.closest && el.closest('[data-no-i18n]')) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute(a)) continue;
      var v = el.getAttribute(a);
      var t = v && v.trim();
      if (!t || !AR.hasOwnProperty(t)) continue;
      var store = seenAttr.get(el) || {};
      if (store.hasOwnProperty(a)) continue;
      store[a] = v;
      seenAttr.set(el, store);
      el.setAttribute(a, v.replace(t, AR[t]));
    }
  }

  function walk(root) {
    if (root.nodeType === 3) {
      translateText(root);
      return;
    }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11)
      return;
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var batch = [],
      n;
    while ((n = tw.nextNode())) batch.push(n);
    batch.forEach(translateText);
    if (root.querySelectorAll) {
      root
        .querySelectorAll('[placeholder],[title],[aria-label]')
        .forEach(translateAttrs);
    }
    if (root.nodeType === 1) translateAttrs(root);
  }

  function toArabic() {
    walk(document.body);
  }

  function toEnglish() {
    seenText.forEach(function (orig, node) {
      if (node && node.isConnected) node.nodeValue = orig;
    });
    seenText.clear();
    seenAttr.forEach(function (store, el) {
      if (el && el.isConnected) {
        Object.keys(store).forEach(function (a) {
          el.setAttribute(a, store[a]);
        });
      }
    });
    seenAttr.clear();
  }

  function apply(l) {
    document.documentElement.setAttribute('lang', l);
    if (l === 'ar') toArabic();
    else toEnglish();
    updateToggles();
  }

  function setLang(l) {
    storeLang(l);
    apply(l);
    try {
      window.dispatchEvent(
        new CustomEvent('i18n:change', { detail: { lang: l } }),
      );
    } catch (e) {}
  }

  function toggle() {
    setLang(getLang() === 'ar' ? 'en' : 'ar');
  }

  function updateToggles() {
    var label = getLang() === 'ar' ? 'English' : 'العربية';
    document.querySelectorAll('[data-lang-toggle]').forEach(function (el) {
      var lbl = el.querySelector('.lt-label') || el;
      lbl.textContent = label;
    });
  }

  function makeToggle(sidebar) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('data-lang-toggle', '');
    btn.setAttribute('data-no-i18n', '');
    btn.innerHTML =
      '<span class="ic" style="display:inline-flex">' +
      GLOBE +
      '</span> <span class="lt-label"></span>';
    if (sidebar) {
      btn.style.cssText =
        'display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;margin-top:4px;' +
        'border:none;background:none;border-radius:10px;color:#475569;font:600 14px/1.2 inherit;cursor:pointer;';
    } else {
      btn.style.cssText =
        'position:fixed;z-index:99999;bottom:18px;right:18px;display:inline-flex;align-items:center;gap:7px;' +
        'padding:9px 14px;border-radius:999px;border:1px solid #e5e7eb;background:#fff;color:#4f46e5;' +
        'font:600 13px/1 -apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 18px rgba(2,6,23,.14);cursor:pointer;';
    }
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      toggle();
    });
    return btn;
  }

  function injectToggle() {
    if (document.querySelector('[data-lang-toggle]')) return; // explicit toggle present
    var side = document.querySelector('.dash-side');
    if (side) {
      var signout = side.querySelector('.signout');
      var el = makeToggle(true);
      if (signout) side.insertBefore(el, signout);
      else side.appendChild(el);
    } else {
      document.body.appendChild(makeToggle(false));
    }
  }

  function wireExplicit() {
    document.querySelectorAll('[data-lang-toggle]').forEach(function (el) {
      if (el.__bmWired) return;
      el.__bmWired = true;
      if (!el.querySelector('.lt-label')) {
        var span = document.createElement('span');
        span.className = 'lt-label';
        el.appendChild(span);
      }
      el.setAttribute('data-no-i18n', '');
      el.addEventListener('click', function (e) {
        e.preventDefault();
        toggle();
      });
    });
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(function (muts) {
      if (getLang() !== 'ar') return;
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 3) translateText(node);
          else if (node.nodeType === 1) walk(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    wireExplicit();
    injectToggle();
    apply(getLang());
    startObserver();
  }

  window.__buzzI18n = {
    setLang: setLang,
    toggle: toggle,
    getLang: getLang,
    t: function (k) {
      return getLang() === 'ar' && AR[k] ? AR[k] : k;
    },
  };
  window.I18n = window.__buzzI18n;

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();
})();
