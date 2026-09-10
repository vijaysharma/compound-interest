import { Link } from '@/navigation';
import styles from './Breadcrumb.module.scss';
export interface BreadcrumbItem {
  name: string;
  href?: string;
}
interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}
/**
 * Accessible breadcrumb navigation.
 * Must match the BreadcrumbList structured data on the same page.
 * Renders visible HTML that Googlebot can read for breadcrumb rich results.
 */
const Breadcrumb = ({ items, className = '' }: BreadcrumbProps) => {
  return (
    <nav aria-label="breadcrumb" className={`${styles.nav} ${className}`.trim()}>
      <ol
        className={styles.list}
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={index}
              className={styles.item}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {index > 0 && (
                <span aria-hidden="true" className={styles.separator}>
                  ›
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  className={styles.current}
                  aria-current={isLast ? 'page' : undefined}
                  itemProp="name"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className={styles.link}
                  itemProp="item"
                >
                  <span itemProp="name">{item.name}</span>
                </Link>
              )}
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
export default Breadcrumb;
