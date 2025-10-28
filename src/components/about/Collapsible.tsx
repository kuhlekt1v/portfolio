import { useState } from "preact/hooks";
import type { ComponentChildren } from "preact";

interface Props {
    children?: ComponentChildren;
}

export default function Collapsible({ children }: Props) {
    const [open, setOpen] = useState(false);
    const previewText = open ? "Hide Details ▲" : "Show Details ▼";
    return (
        <>
            <section class="block md:hidden">
                <p class="mb-4" role="button" onClick={() => setOpen(!open)}>{previewText}</p>
                {open && <div>{children}</div>}
            </section>
            <div class="hidden md:block">
                {children}
            </div>
        </>
    );
}
