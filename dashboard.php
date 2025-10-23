 <?php
// Dashboard (SECURE VERSION) - JWT Protected
ob_start();

require_once __DIR__ . '/../jwt/jwt-session.php';
require_once __DIR__ . '/../config/db.php';

// Fetch latest case laws - using the same query logic from case-laws.php
$latest_cases = [];
$limit = 8; // Only show 8 latest cases

// Similar to the query in case-laws.php but simplified for dashboard
$case_sql = "
    SELECT 
        cl.id, cl.published_year, cl.journal_page_number, jn.journal_name, cn.court_name,
        cl.petitioner_name, cl.respondent_name, cl.judge_name
    FROM case_laws cl
    LEFT JOIN journals_name jn ON cl.journal_name = jn.id
    LEFT JOIN court_names cn ON cl.court_id = cn.Id
    ORDER BY cl.id DESC LIMIT ?";

$stmt = $conn->prepare($case_sql);
$stmt->bind_param('i', $limit);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $latest_cases[] = $row;
}
$stmt->close();

// Fetch latest statutes - referencing the logic from statutes.php
$latest_statutes = [];
$statute_limit = 8;

// Only use main_statues and created_at from main_statues table
$sql = "SELECT main_statues, created_at 
        FROM main_statues
        ORDER BY id DESC LIMIT ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $statute_limit);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    // Format date as "d-M-Y" (e.g., 24-Aug-2025)
    $row['created_at'] = date('d-M-Y', strtotime($row['created_at']));
    $latest_statutes[] = $row;
}
$stmt->close();

// Fetch all journals for the new Journals section
$journals = [];
$journals_sql = "SELECT * FROM journals_name ORDER BY id DESC";
$journals_result = $conn->query($journals_sql);
if ($journals_result && $journals_result->num_rows > 0) {
    while ($row = $journals_result->fetch_assoc()) {
        $journals[] = $row;
    }
}

// Get statistics for dashboard cards
$total_cases = 0;
$total_statutes = 0;
$total_journals = count($journals);

// Count total case laws
$count_sql = "SELECT COUNT(*) as total FROM case_laws";
$count_result = $conn->query($count_sql);
if ($count_result) {
    $total_cases = $count_result->fetch_assoc()['total'];
}

// Count total statutes
$count_sql = "SELECT COUNT(*) as total FROM main_statues";
$count_result = $conn->query($count_sql);
if ($count_result) {
    $total_statutes = $count_result->fetch_assoc()['total'];
}
?>
 <!DOCTYPE html>
 <html lang="en">

 <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>Pakistan Law Help - Dashboard</title>
     <link rel="preconnect" href="https://fonts.googleapis.com">
     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
     <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
     <script src="https://cdn.tailwindcss.com"></script>
     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
     <link rel="stylesheet" href="/assets/css/style.css">
     <script>
     tailwind.config = {
         theme: {
             extend: {
                 fontFamily: {
                     poppins: ['Poppins', 'sans-serif'],
                 },
                 colors: {
                     themegreen: "var(--color-primary)",
                     themegreenDark: "var(--hover-primary)",
                     themeblack: "var(--color-dark)",
                     themeblackLight: "var(--hover-dark)",
                     themegray: "var(--color-body)",
                     themeborder: "var(--color-light)"
                 },
                 fontSize: {
                     "smplus": "var(--text-sm)",
                     "baseplus": "var(--text-base)"
                 }
             }
         }
     }
     </script>
     <style>
     body {
         font-family: 'Poppins', sans-serif;
         font-size: var(--text-base);
     }

     .gradient-bg {
         background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
     }

     .card-hover {
         transition: transform 0.3s ease, box-shadow 0.3s ease;
     }

     .card-hover:hover {
         transform: translateY(-1px);
         box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
     }

     .case-law-link:hover .text-gray-800 {
         color: var(--color-primary) !important;
     }

     .main-statute-link:hover .text-gray-800 {
         color: var(--color-primary) !important;
     }

     /* Custom scrollbar */
     .custom-scrollbar::-webkit-scrollbar {
         height: 8px;
         width: 8px;
     }

     .custom-scrollbar::-webkit-scrollbar-track {
         background: var(--color-body);
         border-radius: 10px;
     }

     .custom-scrollbar::-webkit-scrollbar-thumb {
         background: var(--color-primary);
         border-radius: 10px;
     }

     .custom-scrollbar::-webkit-scrollbar-thumb:hover {
         background: var(--hover-primary);
     }
     </style>
 </head>

 <body class="bg-gray-100 min-h-screen p-3 sm:p-6">
     <div class="max-w-7xl mx-auto">
         <!-- Dashboard Header -->
         <div class="mb-6 sm:mb-8">
             <h1 class="text-2xl sm:text-3xl font-bold text-themeblack">Pakistan Law Help Dashboard</h1>
             <p class="text-gray-600 text-sm sm:text-base">Welcome back! Here's your comprehensive legal research
                 platform.</p>
         </div>

         <!-- Stats Grid -->
         <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
             <!-- Case Law Database -->
             <div class="bg-white rounded-xl shadow-md p-6 card-hover flex flex-col">
                 <div class="flex justify-between items-start mb-4">
                     <div class="flex-1">
                         <h4 class="text-gray-600 text-sm font-extrabold">Case Law Database</h4>
                         <p class="text-sm text-gray-600 leading-relaxed mt-2">Gain access to a massive archive of case
                             laws across different courts.</p>
                     </div>
                     <div class="gradient-bg p-3 rounded-lg ml-4">
                         <i class="fas fa-gavel text-white text-xl"></i>
                     </div>
                 </div>
                 <button onclick="window.location.href='/my-account/case-laws/'"
                     class="mt-auto w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition duration-200">
                     Browse Case Laws
                 </button>
             </div>

             <!-- Statutes & Regulations -->
             <div class="bg-white rounded-xl shadow-md p-6 card-hover flex flex-col">
                 <div class="flex justify-between items-start mb-4">
                     <div class="flex-1">
                         <h4 class="text-gray-600 text-sm font-extrabold">Statutes &amp; Regulations</h4>
                         <p class="text-sm text-gray-600 leading-relaxed mt-2">Updated collection of federal and state
                             statutes</p>
                     </div>
                     <div class="bg-blue-100 p-3 rounded-lg ml-4">
                         <i class="fas fa-book text-blue-600 text-xl"></i>
                     </div>
                 </div>
                 <button onclick="window.location.href='/my-account/statutes/'"
                     class="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition duration-200">
                     Browse Statutes
                 </button>
             </div>

             <!-- Legal Research Tools -->
             <div class="bg-white rounded-xl shadow-md p-6 card-hover flex flex-col">
                 <div class="flex justify-between items-start mb-4">
                     <div class="flex-1">
                         <h4 class="text-gray-600 text-sm font-extrabold">Legal Research Tools</h4>
                         <p class="text-sm text-gray-600 leading-relaxed mt-2">Advanced search and annotation features
                         </p>
                     </div>
                     <div class="bg-orange-100 p-3 rounded-lg ml-4">
                         <i class="fas fa-search text-orange-600 text-xl"></i>
                     </div>
                 </div>
                 <button onclick="window.location.href='/my-account/citations/'"
                     class="mt-auto w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-medium transition duration-200">
                     Access Tools
                 </button>
             </div>

             <!-- AI Assistant card -->
             <div class="bg-white rounded-xl shadow-md p-6 card-hover flex flex-col">
                 <div class="flex justify-between items-start mb-4">
                     <div class="flex-1">
                         <h4 class="text-gray-600 text-sm font-extrabold">AI Assistant</h4>
                         <p class="text-sm text-gray-600 leading-relaxed mt-2">Smart legal research assistant powered by
                             AI technology</p>
                     </div>
                     <div class="bg-green-100 p-3 rounded-lg ml-4">
                         <i class="fas fa-robot text-green-600 text-xl"></i>
                     </div>
                 </div>
                 <button onclick="window.location.href='/my-account/ai-assistant/'"
                     class="mt-auto w-full bg-themegreen hover:bg-themegreenDark text-white py-2 px-4 rounded-lg font-medium transition duration-200">
                     Try AI Assistant
                 </button>
             </div>
         </div>

         <!-- AI Assistant Search Bar -->
         <div class="bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 card-hover border border-gray-700">
             <div class="flex items-center mb-4">
                 <div class="bg-themegreen p-2 rounded-lg mr-3">
                     <i class="fas fa-robot text-white text-lg"></i>
                 </div>
                 <div>
                     <h3 class="text-lg font-semibold text-white">AI Legal Assistant 1</h3>
                     <p class="text-sm text-gray-300">Ask any legal question and get instant AI-powered assistance</p>
                 </div>
             </div>
             <div class="relative">
                 <input type="text"
                     placeholder="Ask about case laws, statutes, legal procedures, or any legal question..."
                     class="w-full pl-4 pr-12 py-3 text-sm rounded-lg bg-gray-800 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-themegreen focus:border-themegreen text-white placeholder-gray-400 transition duration-300"
                     id="aiSearchInput">
                 <button onclick="handleAISearch()" id="sendButton"
                     class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-themegreen hover:bg-themegreenDark text-white px-3 py-2 rounded-lg transition duration-200">
                     <i class="fas fa-paper-plane"></i>
                 </button>
             </div>
             <div class="flex flex-wrap gap-2 mt-3">
                 <span class="text-xs text-gray-400 justify-self-center self-center">Quick suggestions:</span>
                 <button
                     class="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded transition duration-200">Filing
                     procedures</button>
                 <button
                     class="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded transition duration-200">Civil
                     vs Criminal</button>
                 <button
                     class="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded transition duration-200">Recent
                     judgments</button>
             </div>
         </div>


         <!-- Main Content Section -->
         <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
             <!-- Latest Case Laws -->
             <div class="bg-white rounded-xl shadow-md p-6 card-hover">
                 <div class="flex justify-between items-center mb-6">
                     <h3 class="text-lg font-semibold text-themeblack">Latest Case Laws</h3>
                     <a href="/my-account/case-laws/" class="text-sm text-purple-600 font-medium">View All</a>
                 </div>
                 <div class="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                     <?php foreach ($latest_cases as $case): ?>
                     <div class="flex items-start border-b border-gray-100 pb-4 last:border-b-0 cursor-pointer"
                         onclick="window.location.href='/my-account/case-laws.php?filter_related=<?= $case['id'] ?>'">
                         <div class="bg-purple-100 p-2 rounded-lg mr-4 flex-shrink-0">
                             <i class="fas fa-gavel text-purple-600"></i>
                         </div>
                         <div class="flex-1 case-law-link">
                             <h4 class="font-medium text-themeblack">
                                 <strong><?= htmlspecialchars($case['petitioner_name']) ?> v.
                                     <?= htmlspecialchars($case['respondent_name']) ?></strong>
                             </h4>
                             <p class="text-sm text-gray-600"><?= htmlspecialchars($case['court_name']) ?></p>
                             <p class="text-xs text-gray-500 mt-1"><?= htmlspecialchars($case['published_year']) ?>
                                 <?= htmlspecialchars($case['journal_name']) ?>
                                 <?= htmlspecialchars($case['journal_page_number']) ?></p>
                         </div>
                     </div>
                     <?php endforeach; ?>

                     <?php if (empty($latest_cases)): ?>
                     <div class="text-center text-gray-500 py-8">
                         <i class="fas fa-search text-3xl mb-2"></i>
                         <p>No case laws found</p>
                     </div>
                     <?php endif; ?>
                 </div>
             </div>

             <!-- Latest Statutes -->
             <div class="bg-white rounded-xl shadow-md p-6 card-hover">
                 <div class="flex justify-between items-center mb-6">
                     <h3 class="text-lg font-semibold text-themeblack">Latest Statutes</h3>
                     <a href="/my-account/statutes/" class="text-sm text-purple-600 font-medium">View All</a>
                 </div>
                 <div class="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                     <?php foreach ($latest_statutes as $statute): ?>
                     <div class="flex items-start border-b border-gray-100 pb-4 last:border-b-0">
                         <div class="bg-blue-100 p-2 rounded-lg mr-4 flex-shrink-0">
                             <i class="fas fa-book text-blue-600"></i>
                         </div>
                         <div class="flex-1">
                             <a class="main-statute-link"
                                 href="/my-account/act-ordinance.php?filter_main_statute=<?= urlencode($statute['main_statues']) ?>">
                                 <h4 class="font-medium text-themeblack">
                                     <?= htmlspecialchars($statute['main_statues']) ?></h4>
                             </a>
                             <p class="text-sm text-gray-600">Federal Statute</p>
                             <p class="text-xs text-gray-500 mt-1"><?= htmlspecialchars($statute['created_at']) ?></p>
                         </div>
                     </div>
                     <?php endforeach; ?>

                     <?php if (empty($latest_statutes)): ?>
                     <div class="text-center text-gray-500 py-8">
                         <i class="fas fa-search text-3xl mb-2"></i>
                         <p>No statutes found</p>
                     </div>
                     <?php endif; ?>
                 </div>
             </div>
         </div>

         <!-- Quick Resources & FAQs -->
         <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
             <!-- Quick Resources -->
             <div class="bg-white rounded-xl shadow-md p-6 card-hover">
                 <div class="flex justify-between items-center mb-6">
                     <h3 class="text-lg font-semibold text-themeblack">Quick Resources</h3>
                     <button class="text-sm text-purple-600 font-medium">View All</button>
                 </div>
                 <div class="space-y-4">
                     <a href="/my-account/ai-assistant/"
                         class="flex items-start p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg hover:from-purple-100 hover:to-blue-100 transition duration-200">
                         <div class="bg-purple-100 p-2 rounded-lg mr-4">
                             <i class="fas fa-robot text-purple-600"></i>
                         </div>
                         <div>
                             <h4 class="text-gray-600 text-sm font-extrabold">AI Assistant</h4>
                             <p class="text-sm text-gray-600">Get legal research help with AI (Beta)</p>
                         </div>
                     </a>
                     <a href="/my-account/citations/"
                         class="flex items-start p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg hover:from-green-100 hover:to-teal-100 transition duration-200">
                         <div class="bg-themegreenLight p-2 rounded-lg mr-4">
                             <i class="fas fa-quote-right text-themegreen"></i>
                         </div>
                         <div>
                             <h4 class="text-gray-600 text-sm font-extrabold">Search Citations</h4>
                             <p class="text-sm text-gray-600">Find legal citations and references</p>
                         </div>
                     </a>
                     <a href="/my-account/legal-terms/"
                         class="flex items-start p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition duration-200">
                         <div class="bg-blue-100 p-2 rounded-lg mr-4">
                             <i class="fas fa-bookmark text-blue-600"></i>
                         </div>
                         <div>
                             <h4 class="text-gray-600 text-sm font-extrabold">Legal Terms</h4>
                             <p class="text-sm text-gray-600">Browse legal terminology dictionary</p>
                         </div>
                     </a>
                     <a href="/my-account/maxims/"
                         class="flex items-start p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg hover:from-yellow-100 hover:to-orange-100 transition duration-200">
                         <div class="bg-yellow-100 p-2 rounded-lg mr-4">
                             <i class="fas fa-scroll text-yellow-600"></i>
                         </div>
                         <div>
                             <h4 class="text-gray-600 text-sm font-extrabold">Legal Maxims</h4>
                             <p class="text-sm text-gray-600">Explore fundamental legal principles</p>
                         </div>
                     </a>
                 </div>
             </div>

             <!-- FAQs -->
             <div class="bg-white rounded-xl shadow-md p-6 card-hover">
                 <div class="flex justify-between items-center mb-6">
                     <h3 class="text-lg font-semibold text-themeblack">Frequently Asked Questions</h3>
                 </div>
                 <div class="space-y-6">
                     <div>
                         <div class="flex items-start">
                             <div class="bg-themegreenLight p-2 rounded-lg mr-4 flex-shrink-0">
                                 <i class="fas fa-question text-themegreen"></i>
                             </div>
                             <div>
                                 <h4 class="text-gray-600 text-sm font-extrabold">How often is the database updated?
                                 </h4>
                                 <p class="text-sm text-gray-600 mt-1">Our database is updated daily with the latest
                                     judgments from major courts across Pakistan.</p>
                             </div>
                         </div>
                     </div>
                     <div>
                         <div class="flex items-start">
                             <div class="bg-blue-100 p-2 rounded-lg mr-4 flex-shrink-0">
                                 <i class="fas fa-archive text-blue-600"></i>
                             </div>
                             <div>
                                 <h4 class="text-gray-600 text-sm font-extrabold">Are historical statutes available?
                                 </h4>
                                 <p class="text-sm text-gray-600 mt-1">Yes, we maintain comprehensive archives of
                                     current
                                     and historical statutes.</p>
                             </div>
                         </div>
                     </div>
                     <div>
                         <div class="flex items-start">
                             <div class="bg-purple-100 p-2 rounded-lg mr-4 flex-shrink-0">
                                 <i class="fas fa-tools text-purple-600"></i>
                             </div>
                             <div>
                                 <h4 class="text-gray-600 text-sm font-extrabold">What additional resources are
                                     available?</h4>
                                 <p class="text-sm text-gray-600 mt-1">Access legal terms, maxims, citations, and
                                     AI-powered research assistance.</p>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
         </div>

         <!-- Journals Section -->
         <div class="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6 sm:mb-8 card-hover">
             <h3 class="text-lg font-semibold text-themeblack mb-4 sm:mb-6">Available Legal Journals</h3>
             <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                 <?php foreach ($journals as $journal): ?>
                 <div class="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition duration-200">
                     <div class="flex items-center">
                         <div class="bg-indigo-100 p-2 rounded-lg mr-3">
                             <i class="fas fa-newspaper text-indigo-600"></i>
                         </div>
                         <div>
                             <h4 class="font-medium text-themeblack text-sm">
                                 <?= htmlspecialchars($journal['journal_name']); ?></h4>
                             <p class="text-xs text-gray-500">Legal Publication</p>
                         </div>
                     </div>
                 </div>
                 <?php endforeach; ?>

                 <?php if (empty($journals)): ?>
                 <div class="col-span-full text-center text-gray-500 py-8">
                     <i class="fas fa-newspaper text-3xl mb-2"></i>
                     <p>No journals found</p>
                 </div>
                 <?php endif; ?>
             </div>
         </div>
     </div>

     <script>
     function handleAISearch() {
         const query = document.getElementById("aiSearchInput").value.trim();
         if (query) {
             localStorage.setItem("prefilledQuery", query);
             window.location.href = "/my-account/ai-assistant/";
         } else {
             window.location.href = "/my-account/ai-assistant.php";
         }
     }

     document.addEventListener("DOMContentLoaded", () => {
         const input = document.getElementById("aiSearchInput");
         const sendButton = document.getElementById("sendButton");
         const quickButtons = document.querySelectorAll("div.flex.flex-wrap.gap-2.mt-3 button");

         input.addEventListener("keydown", (e) => {
             if (e.key === "Enter") handleAISearch();
         });

         sendButton.addEventListener("click", handleAISearch);

         quickButtons.forEach((btn) => {
             btn.addEventListener("click", () => {
                 const query = btn.textContent.trim();
                 localStorage.setItem("prefilledQuery", query);
                 window.location.href = "/my-account/ai-assistant/";
             });
         });
     });
     </script>
 </body>

 </html>
 <?php
$page_content = ob_get_clean();
include 'includes/single-page.php';
?>