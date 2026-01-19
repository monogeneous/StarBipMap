import { AlertCircle, CheckCircle2, Dices } from 'lucide-react';

const InputSection = ({ rawMnemonic, onMnemonicChange, validationResults, onGenerate }) => {
    const handleChange = (e) => {
        onMnemonicChange(e.target.value);
    };

    const wordCount = rawMnemonic.trim().split(/\s+/).filter(w => w).length;
    const isComplete = wordCount === 12;
    const isValid = validationResults.valid && isComplete;

    return (
        <div className="flex items-center gap-4 w-full h-10">
            {/* Left side: Quick Generators */}
            <div className="flex gap-1 shrink-0">
                <button
                    onClick={() => onGenerate(12)}
                    className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 text-cyan-300 rounded border border-white/10 transition-all active:scale-95 whitespace-nowrap"
                    title="Generate 12 Words"
                >
                    <Dices size={12} className="inline mr-1" /> 12
                </button>
                <button
                    onClick={() => onGenerate(24)}
                    className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 text-purple-300 rounded border border-white/10 transition-all active:scale-95 whitespace-nowrap"
                    title="Generate 24 Words"
                >
                    <Dices size={12} className="inline mr-1" /> 24
                </button>
            </div>

            {/* Middle: Single Line Input Area */}
            <div className="grow relative min-w-0">
                <input
                    id="mnemonic"
                    type="text"
                    className="w-full h-9 bg-white/5 border border-white/10 text-white px-3 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none font-mono text-sm transition-all placeholder:text-gray-600 overflow-x-auto"
                    placeholder="Type or paste your seed phrase here..."
                    value={rawMnemonic}
                    onChange={handleChange}
                    spellCheck={false}
                    autoComplete="off"
                />
            </div>

            {/* Right side: Minimal Validation Status */}
            <div className="shrink-0 flex items-center gap-3">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isComplete ? (isValid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400') : 'bg-blue-500/20 text-blue-400'}`}>
                    {wordCount} Words
                </span>

                {isComplete && isValid && (
                    <CheckCircle2 size={16} className="text-green-400" />
                )}

                {wordCount > 0 && !validationResults.valid && (
                    <div className="group relative">
                        <AlertCircle size={16} className="text-red-400 cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black/90 backdrop-blur-md border border-red-500/30 rounded-lg text-[9px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                            <span className="font-bold underline">Invalid: </span>
                            {validationResults.data.map(d => d.index === -1 ? d.word : null).filter(Boolean).join(', ')}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InputSection;
