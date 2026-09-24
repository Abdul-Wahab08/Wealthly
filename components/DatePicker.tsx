import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';

export default function DatePicker(
    {
        selected,
        onChange,
        maxDate
    }: {
        selected: Date,
        onChange: (date: Date) => void,
        maxDate?: Date
    }
) {
    const defaultStyles = useDefaultStyles("light");
    return (
        <DateTimePicker
            mode="single"
            date={selected}
            maxDate={maxDate}
            onChange={({ date }) => date && onChange(new Date(date as string | number | Date))}
            styles={{
                ...defaultStyles,
                today: { borderWidth: 1, borderColor: "#1A1D26" }
            }}
        />
    )
}