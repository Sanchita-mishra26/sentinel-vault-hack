import React from 'react';

import { NavLink } from 'react-router-dom';

import { Hexagon, ShieldAlert, Zap, Lock, BrainCircuit, Network, ArrowRight } from 'lucide-react';

import { motion } from 'framer-motion';



export function Landing() {

  return (

    <div className="flex flex-col min-h-screen">

      {/* Navbar */}

      <nav className="flex items-center justify-between px-12 py-6">

        <div className="flex items-center gap-3">

          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-brand-primary/10 border border-brand-primary/30 shadow-[0_0_15px_rgba(62,166,255,0.3)]">

            <ShieldAlert className="text-brand-primary w-6 h-6 absolute" />

            <Hexagon className="text-brand-accent w-10 h-10 opacity-50 absolute animate-[spin_10s_linear_infinite]" />

          </div>

          <span className="text-2xl font-bold font-heading text-white tracking-widest">

            SENTINEL<span className="text-brand-primary">-VAULT</span>

          </span>

        </div>

       

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">

          <a href="#features" className="hover:text-brand-primary transition-colors">Features</a>

          <a href="#products" className="hover:text-brand-primary transition-colors">Products</a>

          <a href="#security" className="hover:text-brand-primary transition-colors">Security</a>

          <a href="#contact" className="hover:text-brand-primary transition-colors">Contact</a>

        </div>

       

        <div className="flex items-center gap-4">

          <NavLink to="/auth" className="text-sm font-semibold hover:text-white transition-colors">Login</NavLink>

          <NavLink

            to="/auth"

            state={{ mode: 'signup' }}

            className="px-6 py-2.5 rounded-lg bg-brand-primary text-brand-bg font-bold shadow-[0_0_20px_rgba(62,166,255,0.4)] hover:shadow-[0_0_30px_rgba(62,166,255,0.6)] transition-all"

          >

            GET STARTED

          </NavLink>

        </div>

      </nav>



      {/* Hero */}

      <div className="flex-1 flex items-center justify-between px-12 py-16 gap-12 max-w-7xl mx-auto">

       

        <div className="max-w-2xl flex flex-col gap-8 z-10">

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ duration: 0.6 }}

          >

            <h1 className="text-5xl md:text-7xl font-bold font-heading leading-tight mb-4">

              Self-Healing <br/>

              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">

                Distributed Data

              </span> <br/>

              Security Platform

            </h1>

            <p className="text-lg text-slate-400 leading-relaxed max-w-xl">

              Secure sensitive data using AES-256 encryption, intelligent sharding across distributed storage nodes, and AI-powered zero-day threat detection.

            </p>

          </motion.div>

         

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ duration: 0.6, delay: 0.2 }}

            className="flex items-center gap-6"

          >

            <NavLink

              to="/auth"

              state={{ mode: 'signup' }}

              className="group px-8 py-4 rounded-xl bg-brand-primary/10 border border-brand-primary/50 text-brand-primary font-bold shadow-[0_0_15px_rgba(62,166,255,0.2)] hover:bg-brand-primary hover:text-brand-bg transition-all flex items-center gap-2"

            >

              START SIMULATION

              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />

            </NavLink>

          </motion.div>

         

          <motion.div

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            transition={{ duration: 1, delay: 0.5 }}

            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"

          >

            {[

              { title: 'AES-256 Encryption', icon: Lock, desc: 'Military-grade security' },

              { title: 'Intelligent Sharding', icon: Network, desc: 'Zero single point of failure' },

              { title: 'AI Threat Detection', icon: BrainCircuit, desc: 'Predictive anomaly monitoring' }

            ].map((feature, i) => (

              <div key={i} className="glass-card p-5 rounded-2xl flex flex-col gap-3 hover:-translate-y-1 transition-transform">

                <feature.icon className="w-8 h-8 text-brand-accent" />

                <div>

                  <h3 className="font-semibold text-white">{feature.title}</h3>

                  <p className="text-xs text-slate-400 mt-1">{feature.desc}</p>

                </div>

              </div>

            ))}

          </motion.div>

        </div>



        {/* Hero Illustration (Abstract/CSS based for better matching) */}

        <motion.div

          initial={{ opacity: 0, scale: 0.8 }}

          animate={{ opacity: 1, scale: 1 }}

          transition={{ duration: 1 }}

          className="relative w-[500px] h-[500px] hidden lg:flex items-center justify-center"

        >

          {/* Glowing Central Cube */}

          <div className="absolute w-40 h-40 bg-brand-primary/20 backdrop-blur-md border-2 border-brand-primary/50 rounded-2xl shadow-[0_0_50px_rgba(62,166,255,0.5)] z-20 flex items-center justify-center transform rotate-45 animate-pulse">

            <ShieldAlert className="w-20 h-20 text-brand-primary -rotate-45" />

          </div>

         

          {/* Orbital Rings */}

          <div className="absolute w-[150%] h-[150%] border border-brand-accent/20 rounded-full animate-[spin_20s_linear_infinite]" />

          <div className="absolute w-[120%] h-[120%] border border-brand-primary/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

         

          {/* Nodes */}

          {[0, 60, 120, 180, 240, 300].map((deg, i) => (

            <div

              key={i}

              className="absolute w-4 h-4 rounded-full bg-brand-accent shadow-[0_0_15px_rgba(34,225,255,0.8)]"

              style={{

                transform: `rotate(${deg}deg) translate(200px) rotate(-${deg}deg)`,

                animation: `pulse 2s infinite ${i * 0.2}s`

              }}

            />

          ))}

         

          {/* Connecting lines conceptually represented by SVG */}

          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 500 500">

            <circle cx="250" cy="250" r="150" stroke="#3EA6FF" strokeWidth="1" fill="none" strokeDasharray="5,5" className="animate-[spin_30s_linear_infinite]" />

          </svg>

        </motion.div>



      </div>

    </div>

  );

}