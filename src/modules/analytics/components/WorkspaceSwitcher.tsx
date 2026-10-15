import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Store } from 'lucide-react';
import { INSIGHTS_ROOT } from '../nav';

/**
 * Chuyển giữa hai khu của người bán: "Vận hành" và "Phân tích & AI".
 *
 * Mỗi khu NHỚ trang cuối cùng đã mở, nên bấm qua rồi bấm lại là về đúng chỗ đang làm,
 * không bị ném về trang đầu. Đây là lý do có bộ chuyển này thay vì một mục trong thanh
 * bên: hai khu là hai ngữ cảnh làm việc song song, không phải hai mục cùng cấp.
 *
 * Nhớ bằng sessionStorage: hết phiên thì quên, và không đồng bộ giữa các tab.
 */

const OPS_KEY = 'vc-seller-last-ops';
const INSIGHTS_KEY = 'vc-seller-last-insights';
const OPS_HOME = '/seller/dashboard';
const INSIGHTS_HOME = `${INSIGHTS_ROOT}/overview`;

function read(key: string, fallback: string): string {
  try {
    const value = sessionStorage.getItem(key);
    // Chỉ nhận đường dẫn nội bộ: giá trị lạ trong sessionStorage không được thành đích nhảy.
    return value && value.startsWith('/seller') ? value : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* chế độ riêng tư: không nhớ được thì dùng trang mặc định */
  }
}

export function rememberSellerPath(pathname: string, search = '') {
  const full = `${pathname}${search}`;
  if (pathname.startsWith(INSIGHTS_ROOT)) write(INSIGHTS_KEY, full);
  else if (pathname.startsWith('/seller')) write(OPS_KEY, full);
}

export function WorkspaceSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const inInsights = location.pathname.startsWith(INSIGHTS_ROOT);

  const go = (target: 'ops' | 'insights') => {
    rememberSellerPath(location.pathname, location.search);
    navigate(target === 'insights' ? read(INSIGHTS_KEY, INSIGHTS_HOME) : read(OPS_KEY, OPS_HOME));
  };

  const base =
    'inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-none px-3 py-1.5 text-[13px] font-semibold leading-none transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1a6b1a] motion-reduce:transition-none';

  return (
    <div role="group" aria-label="Chuyển khu làm việc" className="inline-flex items-center gap-0.5 rounded-md border border-stone-200 bg-white p-0.5">
      <button type="button" aria-current={!inInsights} onClick={() => go('ops')} className={`${base} ${!inInsights ? 'bg-[#dff0df] text-[#15691a]' : 'bg-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-800'}`}>
        <Store size={15} aria-hidden />
        Vận hành
      </button>
      <button type="button" aria-current={inInsights} onClick={() => go('insights')} className={`${base} ${inInsights ? 'bg-[#dff0df] text-[#15691a]' : 'bg-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-800'}`}>
        <Sparkles size={15} aria-hidden />
        Phân tích &amp; AI
      </button>
    </div>
  );
}
