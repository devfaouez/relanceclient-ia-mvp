type ProspectDetailPageProps = {
  params: {
    id: string;
  };
};

export default function ProspectDetailPage({ params }: ProspectDetailPageProps) {
  return (
    <section>
      <h1 className="text-3xl font-semibold">Prospect</h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder de la fiche prospect {params.id}.
      </p>
    </section>
  );
}
