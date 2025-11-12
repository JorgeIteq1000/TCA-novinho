// src/pages/Dashboard.tsx
// (Arquivo completo com correção de foco)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import SearchModule from "@/components/SearchModule";
import { Search, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { apiFetch, API_BASE_URL } from "@/lib/api";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// Tipo para os resultados de todas as seções
type AllResultsState = Record<string, any[]>;

// Tipo para as Sugestões
interface Suggestion {
  cod_pessoa: string;
  nome: string;
}

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("Pessoa");
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- Estados da Busca Global ---
  const [query, setQuery] = useState("");
  const [isCpfSearch, setIsCpfSearch] = useState(false);
  const [allResults, setAllResults] = useState<AllResultsState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Estados para Sugestões ---
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Debounce para a busca de sugestões
  useEffect(() => {
    // Define um timer de 300ms
    const handler = setTimeout(() => {
      // Só atualiza o 'debouncedQuery' depois que o usuário parar de digitar
      setDebouncedQuery(query);
    }, 300);

    // Limpa o timer se o usuário digitar novamente
    return () => {
      clearTimeout(handler);
    };
  }, [query]); // Roda toda vez que a 'query' (digitação) muda

  // Efeito para buscar sugestões
  useEffect(() => {
    // Função que busca as sugestões na nova API
    const fetchSuggestions = async () => {
      // Só busca se tiver 3+ caracteres
      if (debouncedQuery.length < 3) {
        setSuggestions([]);
        setIsPopoverOpen(false);
        return;
      }

      console.log(
        `[Modo Turbo Sugestões] Buscando sugestões para: ${debouncedQuery}`
      );
      setIsSuggestionsLoading(true);

      try {
        const apiUrl = `${API_BASE_URL}/api/search/suggestions?q=${encodeURIComponent(
          debouncedQuery
        )}&cpf=${isCpfSearch}`;

        const response = await apiFetch(apiUrl);
        if (!response.ok) {
          throw new Error("Erro ao buscar sugestões");
        }
        const data: Suggestion[] = await response.json();
        setSuggestions(data);
        setIsPopoverOpen(true); // Abre o Popover
        console.log("[Modo Turbo Sugestões] Sugestões recebidas:", data);
      } catch (err) {
        console.error("[Modo Turbo Sugestões] Falha:", err);
        setSuggestions([]);
        setIsPopoverOpen(false);
      } finally {
        setIsSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, isCpfSearch]); // Roda quando o 'debouncedQuery' ou o modo CPF mudam

  // Função interna de busca
  const handleSearchInternal = async (
    searchTerm: string,
    searchIsCpf: boolean
  ) => {
    if (!searchTerm.trim()) {
      setAllResults(null);
      setError(null);
      return;
    }

    console.log(
      `[Modo Turbo Dashboard] BUSCA GLOBAL... Query: ${searchTerm}, Modo CPF: ${searchIsCpf}`
    );
    setIsLoading(true); // Loading principal
    setError(null);
    setIsPopoverOpen(false); // Fecha o popover de sugestões
    setSuggestions([]); // Limpa sugestões

    try {
      const apiUrl = `${API_BASE_URL}/api/search/all?q=${encodeURIComponent(
        searchTerm
      )}&cpf=${searchIsCpf}`;

      console.log(`[Modo Turbo Dashboard] Chamando API Global: ${apiUrl}`);
      const response = await apiFetch(apiUrl);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error ||
            `Erro na rede: ${response.status} ${response.statusText}`
        );
      }

      const data: AllResultsState = await response.json();
      console.log("[Modo Turbo Dashboard] Dados recebidos:", data);
      setAllResults(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(
          "[Modo Turbo Dashboard] Erro na busca:",
          err.message,
          err
        );
        if (!err.message.includes("autorização")) {
          setError(`Erro ao buscar dados: ${err.message}.`);
        }
      } else {
        console.error("[Modo Turbo Dashboard] Erro desconhecido:", err);
        setError("Ocorreu um erro desconhecido.");
      }
    } finally {
      setIsLoading(false); // Para o loading principal
    }
  };

  // Botão "Buscar"
  const handleSearchClick = () => {
    console.log("[Modo Turbo Dashboard] Botão 'Buscar' clicado.");
    handleSearchInternal(query, isCpfSearch);
  };

  // Enter no input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      console.log("[Modo Turbo Dashboard] 'Enter' pressionado.");
      handleSearchInternal(query, isCpfSearch);
    }
  };

  // Clique na sugestão
  const handleSuggestionClick = (suggestion: Suggestion) => {
    console.log("[Modo Turbo Dashboard] Sugestão selecionada:", suggestion);
    // 1. Põe o NOME no input (para o usuário ver)
    setQuery(suggestion.nome);
    // 2. Fecha o popover e limpa as sugestões
    setIsPopoverOpen(false);
    setSuggestions([]);
    // 3. Roda a busca global usando a MATRÍCULA (cod_pessoa)
    //    e garantindo que o modo CPF esteja FALSO
    handleSearchInternal(suggestion.cod_pessoa, false);
  };

  const handleSectionChange = (section: string) => {
    if (section === "Configuracoes") {
      console.log("[Modo Turbo Dashboard] Navegando para /configuracoes...");
      navigate("/configuracoes");
      return;
    }
    if (section === "Relatórios") {
      if (user && user.role !== "Admin") {
        console.warn(
          "[Modo Turbo Dashboard] Acesso negado a Relatórios. Usuário não é Admin."
        );
        toast.error("Acesso Negado", {
          description: "Você não tem permissão para acessar esta seção.",
        });
        return;
      }
    }
    setActiveSection(section);
    console.log(`[Modo Turbo Dashboard] Mudou para aba: ${section}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-card rounded-lg p-6 shadow-card">
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              Buscar Aluno (Global)
            </h2>

            <div className="flex flex-col gap-4">
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <div className="flex gap-3">
                  <PopoverTrigger asChild>
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Digite ${
                          isCpfSearch ? "o CPF..." : "o Nome ou Matrícula..."
                        }`}
                        className="w-full pl-12 pr-12 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                        autoComplete="off" // Desliga o autocomplete do navegador
                      />
                      {/* Loader para as sugestões */}
                      {isSuggestionsLoading && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </PopoverTrigger>

                  <Button
                    onClick={handleSearchClick}
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      "Buscar"
                    )}
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cpf-search"
                    checked={isCpfSearch}
                    onCheckedChange={(checked) => {
                      setIsCpfSearch(checked as boolean);
                      console.log(
                        `[Modo Turbo Dashboard] Modo CPF alterado para: ${checked}`
                      );
                    }}
                  />
                  <Label
                    htmlFor="cpf-search"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Buscar apenas por CPF
                  </Label>
                </div>

                {/* Conteúdo do Popover (Lista de Sugestões) */}
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                  // --- MUDANÇA: ADICIONE ESTA LINHA ---
                  onOpenAutoFocus={(e) => {
                    console.log(
                      "[Modo Turbo Popover] Impedindo auto-foco para manter o foco no input."
                    );
                    e.preventDefault();
                  }}
                  // --- FIM DA MUDANÇA ---
                >
                  <Command>
                    <CommandList>
                      <CommandEmpty>
                        {isSuggestionsLoading
                          ? "Buscando..."
                          : "Nenhum resultado encontrado."}
                      </CommandEmpty>
                      {/* Mapeia e renderiza as sugestões */}
                      {suggestions.map((suggestion) => (
                        <CommandItem
                          key={suggestion.cod_pessoa}
                          // O 'value' é usado pelo Command para filtrar,
                          // então colocamos nome e matrícula
                          value={`${suggestion.nome} ${suggestion.cod_pessoa}`}
                          onSelect={() => handleSuggestionClick(suggestion)}
                          className="cursor-pointer"
                        >
                          <User className="mr-2 h-4 w-4" />
                          <span>{suggestion.nome}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {suggestion.cod_pessoa}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <SearchModule
            type={activeSection}
            query={query}
            results={allResults ? allResults[activeSection] : null}
            isLoading={isLoading}
            error={error}
            onRefreshData={() =>
              handleSearchInternal(
                // Ao recarregar dados (ex: salvar ocorrência),
                // busca pelo último resultado de 'Pessoa' se existir
                allResults?.Pessoa?.[0]?.cod_pessoa || query,
                false // Sempre recarrega pelo ID
              )
            }
            pessoaInfo={
              allResults && allResults.Pessoa && allResults.Pessoa.length > 0
                ? allResults.Pessoa[0]
                : null
            }
          />
        </div>
      </main>
    </div>
  );
}