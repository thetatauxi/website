import { ExecBoard } from "@/components/aboutus/execboard"
import { XiChapter } from "@/components/aboutus/xichapter"
import { Pillars } from "@/components/aboutus/pillars"
import { OurHistory } from "@/components/aboutus/history"
import Header from '@/components/aboutus/header';
import React from 'react'
import Page from "@/components/aboutus/aboutpage";
  
export default function AboutUs() {
    return (
      <div>
        <Header />
        <main>
          <section id="exec-board">
            <ExecBoard />
          </section>
          <section id="our-history">
            <OurHistory />
          </section>
          <section id="our-pillars">
            <Pillars />
          </section>
          <section id="xi-chapter">
            <XiChapter />
          </section>
        </main>
      </div>
    );
  }