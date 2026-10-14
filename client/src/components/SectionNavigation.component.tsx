import { useEffect, useRef, useState, type ReactNode } from "react";
import "../styles/SectionNavigation.styles.css";

type NavigationSection = { id: string; title: string; icon: ReactNode; danger?: boolean };

/** Reuse the section heading's icon, including custom icons, in the navigation. */
export function SectionNavigationIcon({ source }: { source: SVGSVGElement }) {
  const container = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const icon = source.cloneNode(true) as SVGSVGElement;
    icon.setAttribute("width", "18");
    icon.setAttribute("height", "18");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("aria-hidden", "true");
    icon.removeAttribute("class");
    container.current?.replaceChildren(icon);
  }, [source]);
  return <span ref={container} className="settings-navigation-icon" aria-hidden="true" />;
}

export default function SectionNavigation({ label, sections, className = "" }: {
  label: string; sections: NavigationSection[]; className?: string;
}) {
  const [active, setActive] = useState("");
  const sectionIds = JSON.stringify(sections.map(({ id }) => id));
  useEffect(() => {
    const ids: string[] = JSON.parse(sectionIds);
    let frame = 0;
    const update = () => {
      frame = 0;
      const visible = ids.map(id => document.getElementById(id)).filter((element): element is HTMLElement => !!element && element.getClientRects().length > 0).sort((first, second) => first.getBoundingClientRect().top - second.getBoundingClientRect().top);
      let current = visible[0]?.id ?? "";
      for (const element of visible) if (element.getBoundingClientRect().top <= 190) current = element.id;
      const root = document.scrollingElement;
      if (root && root.scrollHeight > innerHeight + 2 && scrollY + innerHeight >= root.scrollHeight - 2) current = visible.at(-1)?.id ?? current;
      setActive(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [sectionIds]);

  return <nav className={`settings-navigation ${className}`} aria-label={label}>
    <p className="settings-navigation-label">{label}</p>
    {sections.map(({ id, title, icon, danger }) => <a key={id} href={`#${id}`} className={danger ? "settings-navigation-danger" : undefined} aria-current={active === id ? "location" : undefined} onClick={event => {
      event.preventDefault();
      const section = document.getElementById(id);
      if (!section) return;
      if (section instanceof HTMLDetailsElement) section.open = true;
      setActive(id);
      section.focus({ preventScroll: true });
      section.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }}>
      {icon}<span>{title}</span><span className="settings-navigation-dot" aria-hidden="true" />
    </a>)}
  </nav>;
}
