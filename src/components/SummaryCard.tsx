interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}


export function SummaryCard({
  title,
  value,
  subtitle,
}: SummaryCardProps) {

  return (
    <div
      className="
        rounded-xl
        border
        border-gray-200
        bg-white
        p-5
        shadow-sm
      "
    >
      <p
        className="
          text-sm
          font-medium
          text-gray-500
        "
      >
        {title}
      </p>

      <p
        className="
          mt-2
          text-3xl
          font-semibold
          text-gray-900
        "
      >
        {value}
      </p>

      {subtitle && (
        <p
          className="
            mt-1
            text-sm
            text-gray-500
          "
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}