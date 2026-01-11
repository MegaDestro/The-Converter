import { useState, useMemo, useCallback } from 'react';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { currencyNames, getCurrencySymbol } from '../utils/currency';
import { LABELS } from '../constants';

const CustomSelect = ({ value, onChange, options, activeTab, themeText }) => {
    const getSelectedLabel = (key) => {
        if (activeTab === 'Currency') {
            try {
                const name = currencyNames.of(key);
                const symbol = getCurrencySymbol(key);
                return `${name} (${symbol})`;
            } catch (error) {
                return key;
            }
        }
        const type = activeTab.toLowerCase();
        return LABELS[type]?.[key] || key;
    };

    const [searchQuery, setSearchQuery] = useState('');

    const handleInputRef = useCallback((node) => {
        if (node) {
            setTimeout(() => {
                node.focus();
            }, 50);
        }
    }, []);

    const getOptionLabel = (key) => {
        if (activeTab === 'Currency') {
            return key;
        }
        const type = activeTab.toLowerCase();
        return LABELS[type]?.[key] || key;
    };

    const filteredOptions = useMemo(() => {
        if (!searchQuery) return options;
        const lowerQuery = searchQuery.toLowerCase();
        return options.filter(option => {
            const label = getOptionLabel(option).toLowerCase();
            const symbol = getCurrencySymbol(option).toLowerCase();
            let fullName = '';

            if (activeTab === 'Currency') {
                try {
                    fullName = currencyNames.of(option).toLowerCase();
                } catch (e) { }
            } else {
                const type = activeTab.toLowerCase();
                fullName = (LABELS[type]?.[option] || '').toLowerCase();
            }

            return option.toLowerCase().includes(lowerQuery) ||
                label.includes(lowerQuery) ||
                fullName.includes(lowerQuery) ||
                symbol.includes(lowerQuery);
        });
    }, [options, searchQuery, activeTab]);

    return (
        <div className="relative h-full">
            <Listbox value={value} onChange={onChange}>
                <ListboxButton className={`relative w-full h-full cursor-pointer bg-neutral-900 border border-neutral-800 p-4 pr-10 text-left rounded-xl focus:outline-none smooth-transition text-lg font-medium ${themeText} focus:border-current flex items-center`}>
                    <span className="block w-full break-words leading-tight">{getSelectedLabel(value)}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <ChevronDown className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                    </span>
                </ListboxButton>
                <ListboxOptions
                    transition
                    className="absolute z-50 mt-1 max-h-60 w-max min-w-full overflow-auto rounded-xl bg-neutral-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm origin-top transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                >
                    {/* Sticky Search Input */}
                    <div className="sticky top-0 z-10 bg-neutral-800 p-2 border-b border-neutral-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                            <input
                                ref={handleInputRef}
                                type="text"
                                className={`w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 pl-9 pr-3 text-sm text-neutral-200 focus:outline-none focus:border-current ${themeText}`}
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation() || e.preventDefault()}
                                onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        // Find the first option and focus it.
                                        // We traverse DOM because Headless UI renders standard role="option" elements.
                                        // We need to look up from this input to the panel, then down to options.
                                        const panel = e.currentTarget.closest('[role="listbox"]');
                                        // Actually Headless UI ListboxOptions usually has role="listbox" or similar? 
                                        // Let's rely on a more robust way: use a ref on ListboxOptions or forward traversal.

                                        // Simplest: direct DOM sibling traversal or querySelector on the container.
                                        // The input is INSIDE the ListboxOptions (which renders as a div/ul).
                                        // The sticky div is the first child. The options follow.
                                        const listboxOptions = e.currentTarget.closest('div[role="listbox"]') || e.currentTarget.closest('div.absolute');
                                        if (listboxOptions) {
                                            const firstOption = listboxOptions.querySelector('[role="option"]');
                                            if (firstOption) firstOption.focus();
                                        }
                                    }
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        // Select the first filtered option if available
                                        const listboxOptions = e.currentTarget.closest('div.absolute'); // Heuristic targeting
                                        if (listboxOptions) {
                                            const firstOption = listboxOptions.querySelector('[role="option"]');
                                            if (firstOption) {
                                                firstOption.click(); // Simulate click to select
                                            }
                                        }
                                    }
                                    e.stopPropagation();
                                }}
                            />
                        </div>
                    </div>

                    {filteredOptions.length === 0 ? (
                        <div className="py-4 text-center text-neutral-500 text-sm">No results found</div>
                    ) : (
                        filteredOptions.map((option) => (
                            <ListboxOption
                                key={option}
                                value={option}
                                className={({ focus }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${focus ? 'bg-neutral-700' : 'text-neutral-300'} ${focus ? themeText : ''}`
                                }
                            >
                                {({ selected }) => (
                                    <>
                                        <span className={`block whitespace-nowrap ${selected ? `font-medium ${themeText}` : 'font-normal'}`}>
                                            {getOptionLabel(option)}
                                        </span>
                                        {selected ? (
                                            <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${themeText}`}>
                                                <Check className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                        ) : null}
                                    </>
                                )}
                            </ListboxOption>
                        ))
                    )}
                </ListboxOptions>
            </Listbox>
        </div>
    );
};

export default CustomSelect;
