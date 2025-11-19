import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, Trophy, TrendingUp, MessageSquare, Loader2 } from 'lucide-react';

type ColaboradorRating = {
  id: string;
  nome: string;
  email: string;
  setor: string | null;
  averageRating: number;
  totalRatings: number;
  rating5: number;
  rating4: number;
  rating3: number;
  rating2: number;
  rating1: number;
  comentarios: string[];
};

export default function Reports() {
  const [colaboradores, setColaboradores] = useState<ColaboradorRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatingsReport();
  }, []);

  const fetchRatingsReport = async () => {
    try {
      setLoading(true);

      // Buscar todas as avaliações
      const { data: ratings, error: ratingsError } = await supabase
        .from('request_ratings')
        .select('atendente_id, rating, comentario');

      if (ratingsError) throw ratingsError;

      if (!ratings || ratings.length === 0) {
        setColaboradores([]);
        return;
      }

      // Agrupar por atendente
      const groupedRatings = ratings.reduce((acc, rating) => {
        if (!acc[rating.atendente_id]) {
          acc[rating.atendente_id] = {
            ratings: [],
            comentarios: []
          };
        }
        acc[rating.atendente_id].ratings.push(rating.rating);
        if (rating.comentario) {
          acc[rating.atendente_id].comentarios.push(rating.comentario);
        }
        return acc;
      }, {} as Record<string, { ratings: number[], comentarios: string[] }>);

      // Buscar informações dos colaboradores
      const atendenteIds = Object.keys(groupedRatings);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, email, setor')
        .in('id', atendenteIds);

      if (profilesError) throw profilesError;

      // Combinar dados
      const colaboradoresData: ColaboradorRating[] = profiles?.map(profile => {
        const { ratings, comentarios } = groupedRatings[profile.id];
        const averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        
        return {
          id: profile.id,
          nome: profile.nome,
          email: profile.email,
          setor: profile.setor,
          averageRating,
          totalRatings: ratings.length,
          rating5: ratings.filter(r => r === 5).length,
          rating4: ratings.filter(r => r === 4).length,
          rating3: ratings.filter(r => r === 3).length,
          rating2: ratings.filter(r => r === 2).length,
          rating1: ratings.filter(r => r === 1).length,
          comentarios
        };
      }) || [];

      // Ordenar por média de avaliação (decrescente)
      colaboradoresData.sort((a, b) => b.averageRating - a.averageRating);

      setColaboradores(colaboradoresData);
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-500 text-yellow-500'
                : 'text-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Relatório de Avaliações
          </h1>
          <p className="text-muted-foreground">
            Ranking completo de colaboradores por avaliação dos clientes
          </p>
        </div>

        {colaboradores.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhuma avaliação registrada ainda
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Top 3 */}
            <div className="grid gap-6 md:grid-cols-3">
              {colaboradores.slice(0, 3).map((colab, index) => (
                <Card key={colab.id} className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent" />
                  {index === 0 && (
                    <div className="absolute top-2 right-2">
                      <Trophy className="h-6 w-6 text-yellow-500" />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {colab.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{colab.nome}</CardTitle>
                        <CardDescription className="text-xs">
                          {colab.setor || 'Sem setor'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Média</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-foreground">
                          {colab.averageRating.toFixed(1)}
                        </span>
                        {renderStars(Math.round(colab.averageRating))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total de avaliações</span>
                      <span className="font-semibold text-foreground">{colab.totalRatings}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabela completa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Ranking Completo
                </CardTitle>
                <CardDescription>
                  Todos os colaboradores ordenados por avaliação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {colaboradores.map((colab, index) => (
                    <div
                      key={colab.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-semibold">
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {colab.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{colab.nome}</h3>
                            <p className="text-sm text-muted-foreground">{colab.email}</p>
                            {colab.setor && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Setor: {colab.setor}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl font-bold text-foreground">
                                {colab.averageRating.toFixed(1)}
                              </span>
                              {renderStars(Math.round(colab.averageRating))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {colab.totalRatings} avaliações
                            </p>
                          </div>
                        </div>
                        
                        {/* Distribuição de notas */}
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Distribuição:</p>
                          <div className="grid grid-cols-5 gap-2 text-xs">
                            {[5, 4, 3, 2, 1].map(rating => {
                              const count = colab[`rating${rating}` as keyof ColaboradorRating] as number;
                              const percentage = (count / colab.totalRatings) * 100;
                              return (
                                <div key={rating} className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                    <span className="text-muted-foreground">{rating}</span>
                                  </div>
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-muted-foreground">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Comentários */}
                        {colab.comentarios.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Comentários recentes:
                            </p>
                            <div className="space-y-2">
                              {colab.comentarios.slice(0, 3).map((comentario, idx) => (
                                <div
                                  key={idx}
                                  className="text-sm text-muted-foreground bg-muted/50 p-2 rounded"
                                >
                                  "{comentario}"
                                </div>
                              ))}
                              {colab.comentarios.length > 3 && (
                                <p className="text-xs text-muted-foreground">
                                  +{colab.comentarios.length - 3} comentários
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
