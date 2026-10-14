import React, { useState } from 'react';
import { X, Calculator, Info, ShieldCheck, HelpCircle } from 'lucide-react';

interface AlgorithmExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultM?: number;
  collectionMeanC?: number;
}

export const AlgorithmExplainerModal: React.FC<AlgorithmExplainerModalProps> = ({
  isOpen,
  onClose,
  defaultM = 5000,
  collectionMeanC = 8.05,
}) => {
  const [testV, setTestV] = useState<number>(1200);
  const [testR, setTestR] = useState<number>(9.2);
  const [testM, setTestM] = useState<number>(defaultM);
  const C = collectionMeanC;

  if (!isOpen) return null;

  // Formula computation:
  // WR = (v / (v + m)) * R + (m / (v + m)) * C
  const denom = testV + testM;
  const weightR = denom > 0 ? testV / denom : 0;
  const weightC = denom > 0 ? testM / denom : 1;
  const computedWR = weightR * testR + weightC * C;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0f1322] border border-purple-500/30 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-display">
              IMDb Weighted Rating Engine
            </h3>
            <p className="text-xs text-purple-400/90 font-mono">
              Bayesian Mean Shrinkage Algorithm
            </p>
          </div>
        </div>

        {/* Formula Box */}
        <div className="bg-[#090c15] border border-white/10 rounded-xl p-4 text-center my-4">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">
            Mathematical Formulation
          </div>
          <div className="text-lg md:text-xl font-mono font-bold text-purple-300 py-1">
            WR = (v / (v + m)) &times; R + (m / (v + m)) &times; C
          </div>
          <div className="text-xs text-slate-400 mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 font-mono">
            <div><span className="text-purple-400 font-bold">R</span> = Movie Rating</div>
            <div><span className="text-purple-400 font-bold">v</span> = Vote Count</div>
            <div><span className="text-purple-400 font-bold">m</span> = Min Votes</div>
            <div><span className="text-purple-400 font-bold">C</span> = Dataset Mean</div>
          </div>
        </div>

        {/* Why this is necessary */}
        <div className="space-y-3 text-xs md:text-sm text-slate-300 leading-relaxed">
          <div className="flex gap-2.5 items-start p-3 bg-purple-950/20 rounded-lg border border-purple-900/30">
            <ShieldCheck className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Why Weighted Rating?</strong> A movie with only 2 reviews of 10/10 has an average of 10.0, but isn't objectively higher quality than a masterpiece with 35,000 reviews at 8.7. The parameter <code className="text-purple-300">m</code> shrinks lower-vote movies toward the dataset average <code className="text-purple-300">C ({C.toFixed(2)})</code> until sufficient community consensus is established.
            </div>
          </div>
        </div>

        {/* Interactive Simulation Sandbox */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400" />
            Interactive Shrinkage Simulator
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Raw Rating R: <span className="text-white font-bold">{testR.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.1"
                value={testR}
                onChange={(e) => setTestR(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Votes v: <span className="text-white font-bold">{testV.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min="10"
                max="30000"
                step="100"
                value={testV}
                onChange={(e) => setTestV(parseInt(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Threshold m: <span className="text-white font-bold">{testM.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min="500"
                max="15000"
                step="500"
                value={testM}
                onChange={(e) => setTestM(parseInt(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Real-time Calculation Result */}
          <div className="p-4 rounded-xl bg-[#090d18] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400">
                Weight breakdown: <span className="text-purple-300 font-semibold">{(weightR * 100).toFixed(1)}%</span> from User Rating vs{' '}
                <span className="text-amber-300 font-semibold">{(weightC * 100).toFixed(1)}%</span> from Dataset Mean ({C.toFixed(2)})
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {testV < testM ? '⚠️ Votes below threshold m: score is heavily shrunken towards collection mean.' : '✅ Sufficient votes: score reflects true audience consensus.'}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Computed WR</span>
              <span className="text-2xl font-bold font-mono text-purple-400">
                {computedWR.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Clarification footnote */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-slate-500">
          <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Honest ML Disclosure: This is a popularity-weighted consensus algorithm. It does not track personal viewing habits or collaborative filtering.
          </span>
        </div>
      </div>
    </div>
  );
};
