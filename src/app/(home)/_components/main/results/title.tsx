type Props = {
  title: string;
  subTitle: string;
};

export const ResultTitle = ({ title, subTitle }: Props) => {
  return (
    <div className="flex flex-col gap-2.5 pt-4 text-center md:pt-6">
      <h1 className="text-1-mobile md:text-1 text-foreground">{title}</h1>
      <p className="text-muted-foreground text-5 md:text-3">{subTitle}</p>
    </div>
  );
};
