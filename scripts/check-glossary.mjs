import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Danh sách từ cấm theo Mục 2 của Kế hoạch Cao điểm
const BANNED_TERMS = [
  'Đại dương xanh',
  'Đại dương đỏ',
  'Đóng cổng',
  'Xả hàng',
  'Đang chết',
  'Bom hàng',
  'AI phân tích',
  'Sức cầu',
  'Cửa sổ chuẩn bị',
  'Tỉ lệ cạnh tranh',
  'Mô hình mốc',
  'Dấu vân tay hành vi',
  'Vùng đệm',
  'Cờ quà tặng',
  'Thiên lệch chọn',
];

const TARGET_FILES = [
  path.join(__dirname, '../src/modules/analytics/pages/SeasonalPage.tsx'),
  path.join(__dirname, '../src/modules/analytics/components/seasonal/OccasionTraitChart.tsx'),
  path.join(__dirname, '../src/modules/analytics/components/seasonal/SeasonalTrendsTab.tsx'),
  path.join(__dirname, '../src/modules/analytics/components/seasonal/SeasonalMonthMatrix.tsx'),
  path.join(__dirname, '../src/modules/analytics/components/seasonal/SeasonalHeader.tsx'),
  path.join(__dirname, '../src/modules/analytics/components/seasonal/hub/HubKpiStrip.tsx'),
  path.join(__dirname, '../src/modules/analytics/components/seasonal/hub/HubActionFeed.tsx'),
  path.join(__dirname, '../src/modules/analytics/components/seasonal/hub/HubCalendar120.tsx'),
  path.join(__dirname, '../src/modules/analytics/components/seasonal/hub/HubOpportunities.tsx'),
  path.join(__dirname, '../src/modules/analytics/components/seasonal/hub/HubRisksAndScorecard.tsx'),
  path.join(__dirname, '../src/modules/analytics/components/evidence/EvidenceDrawer.tsx'),
  path.join(__dirname, '../src/modules/analytics/components/evidence/PrecedentCard.tsx'),
];

let hasErrors = false;

console.log('=== KIỂM TRA QUY TẮC TỪ NGỮ GIAO DIỆN (GLOSSARY AUDIT) ===');

for (const filePath of TARGET_FILES) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[CẢNH BÁO] Không tìm thấy file: ${filePath}`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const violations = [];

  for (const term of BANNED_TERMS) {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(content)) {
      violations.push(term);
    }
  }

  if (violations.length > 0) {
    console.error(`[LỖI] ${path.basename(filePath)} chứa các từ cấm: ${violations.join(', ')}`);
    hasErrors = true;
  } else {
    console.log(`[PASS] ${path.basename(filePath)} đạt chuẩn từ ngữ`);
  }
}

if (hasErrors) {
  console.error('\n=> THẤT BẠI: Phát hiện từ ngữ không thân thiện với seller. Cần sửa trước khi giao hàng.');
  process.exit(1);
} else {
  console.log('\n=> THÀNH CÔNG: 100% file đã tuân thủ nghiêm ngặt từ điển từ ngữ!');
}
