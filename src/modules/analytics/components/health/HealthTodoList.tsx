import { Alert, Button } from 'antd';
import { Link } from 'react-router-dom';
import { plainText } from '../../format';
import type { ListingHealth } from '../../healthTypes';
import { editLink } from '../HealthParts';
import { Section } from './Section';
import { TodoStep } from './TodoStep';
import { visibleTodos } from './visibleTodos';

export function HealthTodoList({ data, productId }: { data: ListingHealth; productId: string }) {
  const urgent = data.warnings.filter(w => w.type === 'warning');
  const hints = data.warnings.filter(w => w.type === 'info');
  const todos = visibleTodos(data);

  return (
    <Section title="Nên làm theo thứ tự này">
      {urgent.map(item => (
        <Alert
          key={item.message}
          type="error"
          showIcon
          className="!mb-3"
          title={<span className="font-medium">{plainText(item.message)}</span>}
          action={item.field && <Link to={editLink(productId, item.field)}><Button size="small" danger>Sửa ngay</Button></Link>}
        />
      ))}
      {todos.length === 0
        ? <p className="m-0 text-sm text-stone-500">Không còn việc nào cần làm.</p>
        : <ol className="m-0 list-none divide-y divide-stone-100 p-0">{todos.map((item, i) => <TodoStep key={item.code ?? item.message} item={item} index={i + 1} productId={productId} />)}</ol>}
      {hints.length > 0 && (
        <div className="mt-2 pt-3">
          <p className="m-0 text-[13px] font-semibold text-stone-700">Gợi ý thêm</p>
          <ul className="m-0 mt-1.5 list-disc space-y-1 pl-5 text-[13px] text-stone-600">
            {hints.map(item => <li key={item.message}>{plainText(item.message)}</li>)}
          </ul>
        </div>
      )}
    </Section>
  );
}
