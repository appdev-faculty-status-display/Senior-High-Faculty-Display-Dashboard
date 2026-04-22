import IconChevron from "./icons/ChevronIcon";

interface Props {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    }

    export default function SelectFilter({ value, onChange, options }: Props) {
    return (
        <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
        >
            {options.map((o) => (
            <option key={o}>{o}</option>
            ))}
        </select>
        <span className="absolute right-2 top-1/2 -translate-y-1/2">
            <IconChevron />
        </span>
        </div>
    );
}