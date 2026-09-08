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
  attached = 'none',
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
  const getAttachmentClass = () => {
    if (attached === 'top' || btnClass.includes('border-b-0') || btnClass.includes('rounded-bl-none')) {
      return styles.attachedTop;
    }
    if (attached === 'bottom' || btnClass.includes('border-t-0') || btnClass.includes('rounded-tl-none')) {
      return styles.attachedBottom;
    }
    if (attached === 'middle') {
      return styles.attachedMiddle;
    }
    return '';
  };
  return (
    <div className={`${styles.container} ${className}`.trim()}>
      {title && <h5 className={styles.title}>{title}</h5>}
      <div className={`${styles.buttonGroup} ${getAttachmentClass()}`.trim()}>
        {data &&
          data.map((p) => {
            const isSelected = selectedValue === p.value;
            return (
              <button
                key={p.id}
                type="button"
                className={`${styles.button} ${getSizeClass()} ${
                  isSelected ? styles.active : ''
                }`.trim()}
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
