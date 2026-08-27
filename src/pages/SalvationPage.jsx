import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, Globe, ArrowRight } from 'lucide-react';
import GospelContent from '@/components/GospelContent';

export default function SalvationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="w-full max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 py-10 pb-24">
        <div className="text-center mb-6">
          <Link
            to="/landing"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Landing
          </Link>
        </div>

        <Link
          to="/spanish-gospel"
          className="flex items-center gap-3 p-5 rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group mb-6"
        >
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-sky-500 to-blue-600">
            <Globe className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">¿Necesitas el Evangelio en Español?</p>
            <p className="font-sans text-xs text-muted-foreground">El Evangelio de Salvación en español</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </Link>

        <GospelContent showPreachers />
      </div>
    </div>
  );
}