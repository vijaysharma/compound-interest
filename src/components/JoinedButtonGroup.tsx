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
  const getSizeClass = () => {
    switch (sizePrefix) {
      case 'xs':
        return styles.sizeXs;
      case 'sm':
        return styles.sizeSm;
      case 'md':
        return styles.sizeMd;
      case 'lg':
        return styles.sizeLg;
      default:
        return styles.sizeSm;
    }
  };
  return (
    <div className={`${styles.container} ${className}`.trim()}>
      {title && <h5 className={styles.title}>{title}</h5>}
      <div className={`join ${styles.joinGroup}`}>
        {data &&
          data.map((p) => {
            const isSelected = selectedValue === p.value;
            return (
              <button
                key={p.id}
                type="button"
                className={`join-item ${styles.joinBtn} ${getSizeClass()} ${
                  isSelected ? `${styles.active} btn-primary` : ''
                } ${btnClass}`.trim()}
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
