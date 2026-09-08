import { JoinedButtonType } from '../types/types';
import styles from './JoinedButtonGroup.module.scss';
function JoinedButtonGroup<T = string>({
  data,
  selectedValue,
  updateSelectedValue,
  title,
  sizePrefix = 'sm',
  className = '',
  btnClass = '',
}: JoinedButtonType<T>) {
  return (
    <div className={`${styles.container} ${className}`.trim()}>
      {title && <h5 className={styles.title}>{title}</h5>}
      <div className="join mx-auto w-full">
        {data &&
          data.map((p) => {
            const isSelected = selectedValue === p.value;
            return (
              <button
                key={p.id}
                type="button"
                className={`join-item btn border-primary grow flex-1 ${
                  isSelected ? 'btn-primary' : ''
                } ${sizePrefix ? `btn-${sizePrefix}` : 'btn-sm'} ${btnClass}`.trim()}
                onClick={() => updateSelectedValue(p.value)}
              >
                {p.title}
              </button>
            );
          })}
      </div>
    </div>
  );
}
export default JoinedButtonGroup;
