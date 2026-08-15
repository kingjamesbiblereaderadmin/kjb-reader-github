import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ArrowRight, BookOpen } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/2279e016e_8e738d108_cfb4bf781_Untitled.png";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all duration-300">
      <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative overflow-hidden rounded-lg">
            <img
              src={LOGO_URL}
              alt="KJB Reader"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextElementSibling.style.display = "inline-flex";
              }}
              className="w-8 h-8 object-cover transform group-hover:scale-110 transition-transform duration-500"
            />
            <span
              className="hidden items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-lg font-bold"
            >
              <BookOpen className="w-4 h-4" />
            </span>
          </div>
          <span className="font-bold text-foreground text-lg tracking-tight group-hover:text-primary transition-colors duration-300" style={{ fontFamily: "'Merriweather', serif" }}>
            KJB Reader
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 hover:after:w-full after:bg-foreground after:transition-all after:duration-300">Home</Link>
          <Link to="/Salvation" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 hover:after:w-full after:bg-foreground after:transition-all after:duration-300">Salvation</Link>
          <Link to="/Contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 hover:after:w-full after:bg-foreground after:transition-all after:duration-300">Contact</Link>
          <a href="#" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-full px-5">
              Open Reader <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </a>
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="sm:hidden">
            <Button variant="ghost" size="icon" className="hover:bg-secondary/50 rounded-full">
              <Menu className="w-5 h-5 text-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-card border-border shadow-2xl">
            <nav className="flex flex-col gap-6 mt-12 px-2">
              <Link to="/" onClick={() => setOpen(false)} className="text-lg font-medium text-foreground hover:text-primary transition-colors duration-300 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary/50" /> Home
              </Link>
              <Link to="/Salvation" onClick={() => setOpen(false)} className="text-lg font-medium text-foreground hover:text-primary transition-colors duration-300 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary/50" /> Salvation
              </Link>
              <Link to="/Contact" onClick={() => setOpen(false)} className="text-lg font-medium text-foreground hover:text-primary transition-colors duration-300 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary/50" /> Contact
              </Link>
              <div className="pt-6 mt-2 border-t border-border/50">
                <a href="#" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                  <Button className="gap-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md rounded-xl h-12 text-base">
                    Open Reader <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}