import { Alert, Button, Tag } from 'antd';
import { ListChecks, AlertTriangle, Lightbulb, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { decimal, plainText } from '../../format';
import type { ListingHealth } from '../../healthTypes';
import { editLink } from '../HealthParts';
import { Section } from './Section';
import { TodoStep } from './TodoStep';
import { visibleTodos } from './visibleTodos';

export function HealthTodoList({ data, productId }: { data: ListingHealth; productId: string }) {
  const urgent = data.warnings.filter(w => w.type === 'warning');
  const hints = data.warnings.filter(w => w.type === 'info');
  const todos = visibleTodos(data);
  const totalImpact = todos.reduce((sum, item) => sum + item.impact, 0);

  return (
    <Section
      title="Việc nên làm theo thứ tự ưu tiên"
      subtitle="Thực hiện theo thứ tự tác động từ cao xuống thấp để tối ưu hiệu quả"
      icon={<ListChecks size={18} />}
      extra={
        totalImpact > 0 ? (
          <Tag color="green" className="!m-0 font-jakarta text-xs font-bold">
            +{decimal(totalImpact, 1)} điểm tiềm năng
          </Tag>
        ) : undefined
      }
    >
      {/* Urgent warnings */}
      {urgent.map(item => (
        <Alert
          key={item.message}
          type="error"
          showIcon
          icon={<AlertTriangle size={16} />}
          className="!mb-4 !rounded-xl !border-rose-200 !bg-rose-50/70"
          title={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-rose-900">{plainText(item.message)}</span>
              {item.field && (
                <Link to={editLink(productId, item.field)}>
                  <Button size="small" danger icon={<Pencil size={12} />} className="!flex !items-center !gap-1">
                    Sửa ngay
                  </Button>
                </Link>
              )}
            </div>
          }
        />
      ))}

      {/* Main todo list */}
      {todos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/60 p-6 text-center text-sm text-stone-500">
          Tuyệt vời! Không còn việc nào cần làm. Listing đã hoàn thiện các tiêu chuẩn khuyến nghị.
        </div>
      ) : (
        <ul className="m-0 list-none space-y-3 p-0">
          {todos.map((item, i) => (
            <TodoStep key={item.code ?? item.message} item={item} index={i + 1} productId={productId} />
          ))}
        </ul>
      )}

      {/* Additional hints */}
      {hints.length > 0 && (
        <div className="mt-5 rounded-xl border border-stone-100 bg-stone-50/80 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
            <Lightbulb size={14} className="text-amber-500" />
            <span>Gợi ý tối ưu thêm</span>
          </div>
          <ul className="m-0 mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-stone-600">
            {hints.map(item => (
              <li key={item.message}>{plainText(item.message)}</li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}
