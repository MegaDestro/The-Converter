import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import CustomSelect from './components/CustomSelect';
import { CONVERTER_TYPES, RATES, LABELS } from './constants';
import { currencyNames, getCurrencySymbol } from './utils/currency';

function App() {
    const [activeTab, setActiveTab] = useState('Currency');
    const [amount, setAmount] = useState(1);
    const [fromUnit, setFromUnit] = useState('');
    const [toUnit, setToUnit] = useState('');
    const [animState, setAnimState] = useState('idle'); // 'idle', 'exiting', 'entering'
    const [slideDirection, setSlideDirection] = useState('right'); // 'left' (new comes from left), 'right' (new comes from right)

    // API Data State
    const [currencyRates, setCurrencyRates] = useState({});
    const [currencyList, setCurrencyList] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- EFFECT: Initialize Data ---
    useEffect(() => {
        if (activeTab === 'Currency') {
            if (currencyList.length === 0) {
                fetchCurrency();
            } else {
                // If we have data but switched back from another tab, 
                // ensure the units are valid currencies.
                // WE check if the current 'fromUnit' is in our currency list.
                if (!currencyRates[fromUnit]) {
                    setFromUnit('USD');
                    setToUnit('EUR');
                }
            }
        } else {
            // Set defaults for physical units
            const type = activeTab.toLowerCase();
            const keys = Object.keys(RATES[type]);
            setFromUnit(keys[0]);
            setToUnit(keys[1]);
        }
    }, [activeTab]);

    const fetchCurrency = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('https://open.er-api.com/v6/latest/USD');
            if (!res.ok) throw new Error('Failed to fetch data');
            const data = await res.json();
            setCurrencyRates(data.rates);
            setCurrencyList(Object.keys(data.rates));
            setLastUpdated(new Date().toLocaleTimeString());

            // Set currency defaults only if not set
            if (!fromUnit || !data.rates[fromUnit]) {
                setFromUnit('USD');
                setToUnit('EUR');
            }
        } catch (error) {
            console.error("API Error:", error);
            setError("Unable to connect to currency service.");
        } finally {
            setLoading(false);
        }
    };

    // --- HELPERS ---

    const formatNumber = (numStr, unit) => {
        if (!numStr) return '';
        const cleanVal = numStr.toString().replace(/,/g, '');
        const val = parseFloat(cleanVal);
        if (isNaN(val)) return numStr;

        // Standard Formatting for Input (Just commas)
        const locale = unit === 'INR' ? 'en-IN' : 'en-US';
        return new Intl.NumberFormat(locale, { maximumFractionDigits: 10, useGrouping: true }).format(val);
    };

    const formatResult = (val, unit) => {
        if (isNaN(val)) return '0';

        // If value is small, verify precision but don't abbreviate
        if (Math.abs(val) < 100000) {
            const locale = unit === 'INR' ? 'en-IN' : 'en-US';
            return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: true }).format(val);
        }

        // Large Number Logic
        if (unit === 'INR') {
            // INR Specific: Lakhs/Crores
            if (val >= 10000000) { // 1 Crore
                return (val / 10000000).toFixed(2) + ' Cr';
            } else if (val >= 100000) { // 1 Lakh
                return (val / 100000).toFixed(2) + ' L';
            }
        } else {
            // International: Million/Billion/Trillion
            return new Intl.NumberFormat('en-US', {
                notation: "compact",
                compactDisplay: "short",
                maximumFractionDigits: 2
            }).format(val);
        }

        // Fallback
        const locale = unit === 'INR' ? 'en-IN' : 'en-US';
        return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: true }).format(val);
    };

    const cleanNumber = (val) => {
        return val.toString().replace(/,/g, '');
    };

    // --- LOGIC: Calculate Result ---
    const result = useMemo(() => {
        const val = parseFloat(cleanNumber(amount));
        if (!amount || isNaN(val)) return '0';

        let resVal = 0;
        if (activeTab === 'Currency') {
            if (!currencyRates[fromUnit] || !currencyRates[toUnit]) return '0';
            const inUSD = val / currencyRates[fromUnit];
            resVal = (inUSD * currencyRates[toUnit]);
        } else {
            const type = activeTab.toLowerCase();
            const r = RATES[type];
            // Normalize to base unit -> convert to target
            const base = val * r[fromUnit];
            resVal = (base / r[toUnit]);
        }

        // Format Result using new smart logic
        return formatResult(resVal, toUnit);
    }, [amount, fromUnit, toUnit, currencyRates, activeTab]);

    // --- HANDLERS ---
    const handleAmountChange = (e) => {
        // Allow digits and one dot
        const val = e.target.value;
        const clean = val.replace(/[^0-9.]/g, '');

        // Prevent multiple dots
        if ((clean.match(/\./g) || []).length > 1) return;

        setAmount(clean);
    };

    const handleSwap = () => {
        setFromUnit(toUnit);
        setToUnit(fromUnit);
    };

    const handleTabChange = (tab) => {
        if (tab === activeTab || animState !== 'idle') return;

        const currentIndex = CONVERTER_TYPES.indexOf(activeTab);
        const newIndex = CONVERTER_TYPES.indexOf(tab);
        const direction = newIndex > currentIndex ? 'right' : 'left'; // moving to right or left tab?
        // User request: "weight(old) to left, length(new) from right" -> Forward (index increase)
        // So Forward: content moves LEFT (exit -100%, enter from 100%)
        // Backward: content moves RIGHT (exit 100%, enter from -100%)

        // Let's semantically name 'slideDirection' as "direction the NEW card comes FROM"
        // If moving Forward (0->1): Old goes Left, New comes from Right. Direction = 'right'.
        // If moving Backward (1->0): Old goes Right, New comes from Left. Direction = 'left'.

        setSlideDirection(newIndex > currentIndex ? 'right' : 'left');
        setAnimState('exiting');

        setTimeout(() => {
            setActiveTab(tab);
            setAnimState('entering');
            // Small ripple to allow render at offset position before sliding in
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setAnimState('idle');
                });
            });
        }, 150); // Half of 0.3s? Or simple fast exit. Let's do 150ms exit, 150ms enter.
    };

    // Get options for the select
    const currentOptions = useMemo(() => {
        if (activeTab === 'Currency') return currencyList;
        return Object.keys(RATES[activeTab.toLowerCase()] || {});
    }, [activeTab, currencyList]);

    // --- UI: 3D Tilt Logic (Optimized) ---
    const cardRef = useRef(null);
    const containerRef = useRef(null);
    const rafRef = useRef(null);
    const isEnteringRef = useRef(false);

    const handleMouseEnter = () => {
        if (!cardRef.current) return;
        isEnteringRef.current = true;
        // Smooth entry duration
        cardRef.current.style.transition = 'transform 0.2s ease-out';

        // Switch to instant 1:1 tracking after entry animation
        setTimeout(() => {
            isEnteringRef.current = false;
        }, 200);
    };

    const handleMouseMove = (e) => {
        if (!cardRef.current || !containerRef.current) return;

        const card = cardRef.current;
        const container = containerRef.current;
        const rect = container.getBoundingClientRect(); // Use static container for stable coords
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / 77) * -1;
        const rotateY = (x - centerX) / 77;

        // Debounce/Throttle via RequestAnimationFrame
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        rafRef.current = requestAnimationFrame(() => {
            // Only disable transition if we are done with the entry phase
            if (!isEnteringRef.current) {
                card.style.transition = 'none';
            }
            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
    };

    const handleMouseLeave = () => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (cardRef.current) {
            const card = cardRef.current;
            isEnteringRef.current = false;

            // Force a transition to smooth out the reset
            card.style.transition = 'transform 0.5s ease-out';
            card.style.transform = 'rotateX(0deg) rotateY(0deg)';

            // Cleanup after animation completes to return to CSS-defined state
            setTimeout(() => {
                // Ensure we only clear if the card matches (though ref unlikely to change)
                if (cardRef.current === card) {
                    card.style.transition = '';
                    card.style.transform = '';
                }
            }, 500);
        }
    };

    // --- UI: Theme Colors ---
    const themeText = useMemo(() => {
        switch (activeTab) {
            case 'Currency': return 'text-golden';
            case 'Length': return 'text-purple';
            default: return 'text-ocean';
        }
    }, [activeTab]);

    const themeGlow = useMemo(() => {
        switch (activeTab) {
            case 'Currency': return 'glow-golden';
            case 'Length': return 'glow-purple';
            default: return 'glow-ocean';
        }
    }, [activeTab]);

    const themeBackgroundClass = useMemo(() => {
        switch (activeTab) {
            case 'Currency': return 'bg-golden/20';
            case 'Length': return 'bg-purple/20';
            default: return 'bg-ocean/20';
        }
    }, [activeTab]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#0a0a0a]">

            {/* Dynamic Background Hue Layer */}
            <div
                className={`absolute inset-0 transition-colors duration-700 ease-in-out pointer-events-none ${themeBackgroundClass}`}
                style={{
                    maskImage: 'radial-gradient(circle at 50% 40%, black, transparent 70%)',
                    WebkitMaskImage: 'radial-gradient(circle at 50% 40%, black, transparent 70%)'
                }}
            />

            {/* Header - Moved Out */}
            <div className="relative z-10 mb-6 mt-12 text-center">
                <h1 className={`text-6xl font-extrabold tracking-tighter mb-1 transition-colors duration-300 ${themeText}`}>THE CONVERTER<span className="text-neutral-600">.</span></h1>
            </div>

            {/* Tabs - Moved Out & Re-styled */}
            <div className="grid grid-cols-3 bg-black border border-neutral-800 rounded-full mb-8 relative z-10 overflow-hidden p-1 w-full max-w-sm">
                {CONVERTER_TYPES.map((tab) => {
                    let activeClass = '';
                    if (activeTab === tab) {
                        if (tab === 'Currency') activeClass = 'bg-golden text-black shadow-sm';
                        else if (tab === 'Length') activeClass = 'bg-purple text-black shadow-sm';
                        else activeClass = 'bg-ocean text-black shadow-sm';
                    } else {
                        activeClass = 'text-neutral-500 hover:text-white';
                    }

                    return (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`w-full py-2 text-lg font-bold rounded-full smooth-transition relative isolate
                                ${activeClass}`}
                        >
                            {tab}
                        </button>
                    )
                })}
            </div>

            <div
                ref={containerRef}
                className="w-full max-w-md perspective-container"
                style={{ perspective: '1000px' }}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div
                    ref={cardRef}
                    key={activeTab}
                    className={`w-full bg-black border border-neutral-800 p-8 rounded-3xl ${themeGlow} relative overflow-visible
                        transition-all duration-300 ease-in-out min-h-[400px] flex flex-col justify-center
                        ${animState === 'exiting' ? (slideDirection === 'right' ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0') : ''}
                        ${animState === 'entering' ? (slideDirection === 'right' ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0') : ''}
                        ${animState === 'idle' ? 'translate-x-0 opacity-100' : ''}
                    `}
                    style={{
                        willChange: 'transform' // Optimize for GPU
                    }}
                >
                    {/* Content always rendered, we just animate the container */}
                    <div className="space-y-6 relative z-10">
                        {/* Error Banner */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg mb-6 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Main Inputs */}
                        <div>
                            <label className="block text-neutral-500 text-xs uppercase font-bold mb-2">Amount</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={formatNumber(amount.toString(), fromUnit)}
                                onChange={handleAmountChange}
                                className={`w-full bg-neutral-900 border border-neutral-800 text-3xl font-light p-4 rounded-xl focus:outline-none smooth-transition ${themeText} focus:border-current`}
                                style={{ borderColor: 'transparent' }} // Let focus ring handle color via class
                            />
                        </div>

                        {/* Conversion Row */}
                        <div className="flex items-stretch gap-2">
                            {/* FROM */}
                            <div className="flex-1 min-w-0 flex flex-col">
                                <label className="block text-neutral-500 text-xs uppercase font-bold mb-2">From</label>
                                <div className="flex-1">
                                    <CustomSelect
                                        value={fromUnit}
                                        onChange={setFromUnit}
                                        options={currentOptions}
                                        activeTab={activeTab}
                                        themeText={themeText}
                                    />
                                </div>
                            </div>

                            {/* SWAP BUTTON */}
                            <div className="flex flex-col">
                                {/* Spacer to match label height - EXACT copy of label classes + opacity-0 */}
                                <label className="block text-neutral-500 text-xs uppercase font-bold mb-2 opacity-0 pointer-events-none">Swap</label>
                                <div className="flex-1 flex items-center justify-center">
                                    <button
                                        onClick={handleSwap}
                                        className={`p-4 text-black rounded-xl hover:bg-neutral-300 active:scale-90 smooth-transition shadow-lg flex items-center justify-center shrink-0 ${activeTab === 'Currency' ? 'bg-golden' : activeTab === 'Length' ? 'bg-purple' : 'bg-ocean'}`}
                                        aria-label="Swap units"
                                    >
                                        <ArrowRightLeft size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* TO */}
                            <div className="flex-1 min-w-0 flex flex-col">
                                <label className="block text-neutral-500 text-xs uppercase font-bold mb-2">To</label>
                                <div className="flex-1">
                                    <CustomSelect
                                        value={toUnit}
                                        onChange={setToUnit}
                                        options={currentOptions}
                                        activeTab={activeTab}
                                        themeText={themeText}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Result */}
                        <div className="mt-8 pt-8 border-t border-neutral-800 text-center">
                            <span className="text-neutral-500 text-sm">Result</span>
                            <div className={`mt-2 flex flex-wrap justify-center items-baseline gap-x-2 ${themeText}`}>
                                <span className="text-6xl font-bold tracking-tighter break-all">{result}</span>
                                <span className="text-xl text-neutral-600 font-normal whitespace-nowrap">
                                    {activeTab === 'Currency' ? (() => {
                                        try {
                                            const name = currencyNames.of(toUnit);
                                            const symbol = getCurrencySymbol(toUnit);
                                            return `${name} (${symbol})`;
                                        } catch { return toUnit; }
                                    })() : (LABELS[activeTab.toLowerCase()]?.[toUnit] || toUnit)}
                                </span>
                            </div>
                        </div>

                        {/* Footer Info */}
                        {activeTab === 'Currency' && !error && (
                            <div className="text-center pt-2">
                                <span className={`text-[10px] uppercase tracking-widest ${loading ? 'text-yellow-500' : 'text-neutral-600'}`}>
                                    {loading ? 'Fetching live rates...' : `Rates Updated: ${lastUpdated}`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
