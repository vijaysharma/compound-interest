import { Link } from 'react-router-dom';
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
    <nav aria-label="breadcrumb" className={`mb-4 ${className}`}>
      <ol
        className="flex flex-wrap items-center gap-1 text-xs text-base-content/60"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={index}
              className="flex items-center gap-1"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {index > 0 && (
                <span aria-hidden="true" className="opacity-40 select-none">
                  ›
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  className="font-medium text-base-content/80"
                  aria-current={isLast ? 'page' : undefined}
                  itemProp="name"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="hover:text-primary transition-colors"
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
