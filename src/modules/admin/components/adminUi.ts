export const PAGE = 'mx-auto w-full max-w-[1600px] text-admin-body';

export const TOOLBAR = 'mb-4 flex flex-wrap items-center gap-x-3 gap-y-2.5';

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-brand';

const BTN_SHAPE =
  'inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-admin border ' +
  'font-semibold leading-none transition-[background-color,border-color,color,box-shadow] duration-150 ' +
  'active:translate-y-px disabled:pointer-events-none disabled:opacity-55 ' +
  `motion-reduce:transition-none ${FOCUS_RING}`;

const SIZE_MD = 'gap-2 px-4 py-[9px] text-[13.5px]';
const SIZE_SM = 'gap-1.5 px-[11px] py-[7px] text-[12.5px]';

const TONE_PRIMARY =
  'border-admin-brand bg-admin-brand text-white hover:bg-admin-brand-700 hover:shadow-[0_4px_12px_rgba(26,107,26,0.24)]';
const TONE_SECONDARY = 'border-[#d5ddd5] bg-white text-admin-body hover:border-[#bcc9bc] hover:bg-admin-canvas';
const TONE_DANGER =
  'border-admin-danger bg-admin-danger text-white focus-visible:outline-admin-danger ' +
  'hover:bg-[#b91c1c] hover:shadow-[0_4px_12px_rgba(220,38,38,0.24)]';
const TONE_DANGER_SOFT =
  'border-[#e4cbcb] bg-white text-[#b42318] focus-visible:outline-admin-danger ' +
  'hover:border-admin-danger hover:bg-admin-danger-050';
const TONE_GHOST = 'border-transparent bg-transparent text-admin-muted hover:bg-admin-canvas hover:text-admin-ink';

export const BTN_PRIMARY = `${BTN_SHAPE} ${SIZE_MD} ${TONE_PRIMARY}`;
export const BTN_SECONDARY = `${BTN_SHAPE} ${SIZE_MD} ${TONE_SECONDARY}`;
export const BTN_DANGER = `${BTN_SHAPE} ${SIZE_MD} ${TONE_DANGER}`;
export const BTN_GHOST = `${BTN_SHAPE} ${SIZE_MD} ${TONE_GHOST}`;

export const BTN_PRIMARY_SM = `${BTN_SHAPE} ${SIZE_SM} ${TONE_PRIMARY}`;
export const BTN_SECONDARY_SM = `${BTN_SHAPE} ${SIZE_SM} ${TONE_SECONDARY}`;
export const BTN_DANGER_SOFT_SM = `${BTN_SHAPE} ${SIZE_SM} ${TONE_DANGER_SOFT}`;

const ICON_BTN_BASE =
  'inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border ' +
  'border-[#dde4dd] bg-white text-admin-muted md:h-9 md:w-9 ' +
  'transition-[background-color,border-color,color] duration-150 active:translate-y-px ' +
  `disabled:pointer-events-none disabled:opacity-55 motion-reduce:transition-none ${FOCUS_RING}`;

export const ICON_BTN = `${ICON_BTN_BASE} hover:border-admin-brand hover:bg-admin-brand-050 hover:text-admin-brand`;
export const ICON_BTN_DANGER = `${ICON_BTN_BASE} hover:border-admin-danger hover:bg-admin-danger-050 hover:text-admin-danger`;

export const CARD = 'overflow-hidden rounded-admin border border-admin-line bg-admin-surface shadow-admin-sm';

export const CARD_HEADER =
  'flex flex-wrap items-center justify-between gap-3 border-b border-admin-line bg-[#fafcfa] px-[18px] py-3';

export const CARD_FOOTER =
  'flex flex-wrap items-center justify-between gap-3 border-t border-admin-line bg-[#fafcfa] px-[18px] py-2.5';

export const TABLE =
  'w-full border-collapse text-left text-[13.5px] ' +
  '[&_thead_th]:whitespace-nowrap [&_thead_th]:border-b [&_thead_th]:border-admin-line [&_thead_th]:bg-[#fafcfa] ' +
  '[&_thead_th]:px-[18px] [&_thead_th]:py-3 [&_thead_th]:text-[11.5px] [&_thead_th]:font-bold ' +
  '[&_thead_th]:uppercase [&_thead_th]:tracking-[0.04em] [&_thead_th]:text-admin-muted ' +
  '[&_tbody_td]:border-b [&_tbody_td]:border-admin-line-soft [&_tbody_td]:px-[18px] [&_tbody_td]:py-3 ' +
  '[&_tbody_td]:align-middle [&_tbody_td]:text-admin-body [&_tbody_tr:last-child_td]:border-b-0 ' +
  '[&_tbody_tr]:transition-colors [&_tbody_tr]:duration-[120ms] [&_tbody_tr:hover]:bg-[#fafdfa] ' +
  'motion-reduce:[&_tbody_tr]:transition-none';

export const FIELD =
  'w-full rounded-admin border border-[#d5ddd5] bg-white px-[13px] py-2.5 text-[13.5px] text-admin-ink ' +
  'outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#9aa6a0] ' +
  'focus:border-admin-brand focus:shadow-[0_0_0_3px_rgba(26,107,26,0.1)] ' +
  'disabled:cursor-not-allowed disabled:bg-admin-canvas disabled:text-admin-muted motion-reduce:transition-none';

export const FIELD_LABEL = 'mb-[7px] block text-[13px] font-semibold text-admin-ink';
export const FIELD_HINT = 'mt-1.5 text-[12px] leading-[1.5] text-admin-muted';
export const FIELD_GROUP = 'mb-[18px] last:mb-0';

export const MODAL_OVERLAY =
  'fixed inset-0 z-[1000] flex animate-[adFade_0.15s_ease] items-start justify-center overflow-y-auto ' +
  'bg-[rgba(16,33,26,0.48)] p-4 backdrop-blur-[2px] sm:items-center sm:p-6 motion-reduce:animate-none';

export const MODAL_PANEL =
  'my-auto w-full animate-[adPop_0.16s_ease] rounded-[14px] bg-white shadow-admin-lg motion-reduce:animate-none';

export const MODAL_HEADER = 'flex items-start justify-between gap-4 border-b border-admin-line px-6 py-5';
export const MODAL_TITLE = 'm-0 text-[17px] font-bold leading-snug text-admin-ink';
export const MODAL_BODY = 'px-6 py-[22px]';
export const MODAL_FOOTER =
  'flex flex-col-reverse gap-2.5 border-t border-admin-line bg-[#fafcfa] px-6 py-4 sm:flex-row sm:items-center sm:justify-end';

export const MONO = "[font-family:ui-monospace,'SF_Mono',Menlo,Consolas,monospace]";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

