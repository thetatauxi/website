import RushFlyer  from "@/components/rush/rush-flyer"
import {RecruitmentHero} from "@/components/rush/rush-header"
import  RushWhyUs  from "@/components/rush/rush-why-us"
import RushVideo from "@/components/rush/rush-video"
import RushInstagram from "@/components/rush/rush-instagram"
import RushImage from "@/components/rush/rush-image"
import { RushFAQ }  from "@/components/rush/rush-faq"
import React from 'react'

export default function AboutUs() {
    return (
      <div>
        <main>
        <section id="rush-header">
          <RecruitmentHero />
          </section>
          <section id="rush-video">
            <RushVideo />
          </section>
          <section id="rush-why-us">
            <RushWhyUs />
          </section>
          <section id="rush-image">
            <RushImage />
          </section>
          <section id="rush-instagram">
            <RushInstagram />
          </section>
          <section id="rush-faq">
            <RushFAQ />
          </section>
        </main>
      </div>
    );
  }