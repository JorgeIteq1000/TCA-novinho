// src/components/SearchModule.tsx
// (Arquivo completo com nova coluna "Financeiro" nos Relatórios)

import { useState, useMemo, FC, useEffect } from "react";
import { Search, Loader2, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Imports da Tabela Arrastável
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
  Header,
  ColumnOrderState,
} from "@tanstack/react-table";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { apiFetch } from "@/lib/api";

interface SearchModuleProps {
  type: string;
  query: string;
  results: any[] | null;
  isLoading: boolean;
  error: string | null;
  onRefreshData: () => void;
  pessoaInfo: any | null;
}

// --- MUDANÇA 1: Adicionar 'financeiro_status' à lista ---
const REPORT_COLUMNS = [
  { id: "cod_pessoa", label: "Matrícula" },
  { id: "nome", label: "Nome" },
  { id: "cpf_cnpj", label: "CPF/CNPJ" },
  { id: "celular", label: "Celular" },
  { id: "email", label: "Email" },
  { id: "curso_nome", label: "Curso" },
  { id: "consultor", label: "Consultor" },
  { id: "financeiro_status", label: "Financeiro" }, // <-- ADICIONADO AQUI
  { id: "fone_residencial", label: "Telefone Residencial" },
  { id: "nascimento_data", label: "Nascimento" },
  { id: "Sexo", label: "Sexo" },
  { id: "rg", label: "RG" },
  { id: "endereco_residencial", label: "Endereço" },
  { id: "bairro_residencial", label: "Bairro" },
  { id: "cidade_residencial", label: "Cidade" },
  { id: "estado_residencial", label: "Estado" },
  { id: "cep_residencial", label: "CEP" },
];
// --- FIM DA MUDANÇA 1 ---

// Constantes de colunas (sem alteração)
const certificadoTableHeaders = [
  { key: "nome", label: "Nome" },
  { key: "tipo_certificado", label: "Tipo Certificado" },
  { key: "data_solicitacao", label: "Data Solicitação" },
  { key: "cod_rastreamento", label: "Cód. Rastreamento" },
];
const certificadoCamposEscondidos = [
  "polo",
  "nome_disciplina",
  "grade",
  "livro",
  "carga_horaria",
  "nota_tcc",
  "nota_01",
  "nota_02",
  "nota_03",
  "nota_04",
  "nota_05",
  "nota_06",
  "nota_07",
  "nota_08",
  "nota_09",
  "nota_10",
  "nota_11",
  "nota_12",
  "nota_13",
  "nota_14",
  "nota_15",
  "nota_16",
  "nota_17",
  "nota_18",
  "cod_curso",
  "cod_disciplina",
  "cod_escola",
  "data_colacao_grau",
  "data_conclusao",
  "data_inicio",
  "data_emissao",
  "folha",
  "data_registro",
];
const observacaoKey = "observacao";
const pessoaTableHeaders = [
  "cod_pessoa",
  "nome",
  "cpf_cnpj",
  "celular",
  "fone_residencial",
  "email",
  "endereco_residencial",
  "bairro_residencial",
  "cidade_residencial",
  "estado_residencial",
  "cep_residencial",
  "sexo",
];
const ocorrenciaTableHeaders = [
  "nome",
  "data",
  "matricula_aluno",
  "descricao",
  "usuario",
];
const requerimentoColunasRemovidas = [
  "chave",
  "cod_requerimento",
  "departamento_detalhe",
  "departamento_principal",
  "tipo_log",
  "usuario",
  "usuario_log",
  "data_hora_log_detalhe",
  "usuario_detalhe",
  "data_hora_log",
];

// Componente de Cabeçalho Arrastável (sem alterações)
const DraggableColumnHeader: FC<{ header: Header<any, unknown> }> = ({
  header,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: header.column.id,
    });
  const style = {
    opacity: isDragging ? 0.8 : 1,
    transform: CSS.Translate.toString(transform),
    transition: "transform 0.2s ease-in-out",
    zIndex: isDragging ? 10 : 1,
    position: "relative",
    cursor: "grab",
  };
  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="px-6 py-3 text-left text-sm font-semibold text-foreground capitalize whitespace-nowrap"
    >
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
    </TableHead>
  );
};

export default function SearchModule({
  type,
  query,
  results,
  isLoading,
  error,
  onRefreshData,
  pessoaInfo,
}: SearchModuleProps) {
  // Estados Padrão
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [novaDescricao, setNovaDescricao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dataDeHoje = new Date().toLocaleDateString("pt-BR");

  // Estados do Construtor de Relatórios
  // --- MUDANÇA 2: Adicionar 'financeiro_status' à seleção padrão ---
  const [reportSelectedCols, setReportSelectedCols] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    REPORT_COLUMNS.forEach((col) => {
      initial[col.id] = [
        "nome",
        "celular",
        "curso_nome",
        "consultor",
        "financeiro_status", // <-- ADICIONADO AQUI
      ].includes(col.id);
    });
    return initial;
  });
  // --- FIM DA MUDANÇA 2 ---
  const [reportPreviewData, setReportPreviewData] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [cursoList, setCursoList] = useState<string[]>(["Todos"]);
  const [consultorList, setConsultorList] = useState<string[]>(["Todos"]);
  const [selectedCurso, setSelectedCurso] = useState<string>("Todos");
  const [selectedConsultor, setSelectedConsultor] = useState<string>("Todos");

  // Estados dos Filtros Financeiros
  const [financeiroCursoFiltro, setFinanceiroCursoFiltro] =
    useState<string>("Todos");
  const [financeiroStatusFiltro, setFinanceiroStatusFiltro] =
    useState<string>("Todos");

  // useEffect para buscar filtros do Relatório
  useEffect(() => {
    if (type === "Relatórios" && !query) {
      const fetchFilters = async () => {
        console.log("[Modo Turbo] Buscando filtros de Curso e Consultor...");
        setReportLoading(true);
        try {
          const cursoResponse = await apiFetch(
            "http://localhost:5000/api/report_filters/cursos"
          );
          if (cursoResponse.ok) {
            const cursoData = await cursoResponse.json();
            setCursoList(["Todos", ...cursoData]);
          } else {
            console.error("Erro ao buscar cursos");
            toast.error("Erro ao carregar lista de cursos.");
          }

          const consultorResponse = await apiFetch(
            "http://localhost:5000/api/report_filters/consultores"
          );
          if (consultorResponse.ok) {
            const consultorData = await consultorResponse.json();
            setConsultorList(["Todos", ...consultorData]);
          } else {
            console.error("Erro ao buscar consultores");
            toast.error("Erro ao carregar lista de consultores.");
          }
        } catch (err) {
          console.error("Erro de rede ao buscar filtros:", err);
          if (!(err instanceof Error && err.message.includes("401"))) {
            toast.error("Não foi possível carregar os filtros de relatório.");
          }
        } finally {
          setReportLoading(false);
        }
      };

      fetchFilters();
      setReportPreviewData([]);
      setSelectedCurso("Todos");
      setSelectedConsultor("Todos");
    }
  }, [type, query]);

  // useEffect para resetar os filtros financeiros
  useEffect(() => {
    console.log("[Modo Turbo] Verificando reset de filtros financeiros...");
    if (type === "Financeiro") {
      setFinanceiroCursoFiltro("Todos");
      setFinanceiroStatusFiltro("Todos");
      console.log("[Modo Turbo] Filtros financeiros resetados.");
    }
  }, [type, results]);

  // Função para Salvar Ocorrência (Atualizada)
  const handleSalvarOcorrencia = async () => {
    if (!novaDescricao) {
      toast.error("Por favor, preencha o campo 'Ocorrência'.");
      return;
    }

    const matricula_aluno = pessoaInfo?.cod_pessoa;
    const nome_aluno = pessoaInfo?.nome;
    if (!matricula_aluno || !nome_aluno) {
      toast.error(
        "Erro: Matrícula ou Nome do aluno não encontrados. Faça a busca novamente."
      );
      return;
    }

    console.log(
      `[Modo Turbo] Salvando Ocorrência... Mat: ${matricula_aluno}, Nome: ${nome_aluno}`
    );
    setIsSubmitting(true);
    try {
      const response = await apiFetch(
        "http://localhost:5000/api/ocorrencia/nova",
        {
          method: "POST",
          body: JSON.stringify({
            matricula_aluno: matricula_aluno,
            nome_aluno: nome_aluno,
            descricao: novaDescricao,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro desconhecido no servidor");
      }

      toast.success("Ocorrência salva com sucesso!");
      console.log(
        "[Modo Turbo] Ocorrência salva, fechando modal e atualizando dados."
      );
      setIsFormOpen(false);
      setNovaDescricao("");
      onRefreshData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(
          "[Modo Turbo] Erro ao salvar ocorrência:",
          err.message,
          err
        );
        toast.error(`Erro ao salvar: ${err.message}`);
      } else {
        console.error("[Modo Turbo] Erro desconhecido ao salvar:", err);
        toast.error("Erro desconhecido ao salvar.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para formatar o nome da chave (sem alterações)
  const formatHeader = (key: string) => {
    if (key === "cpf_cnpj") return "CPF/CNPJ";
    if (key === "matricula_aluno") return "Matrícula Aluno";
    if (key === "curso_nome") return "Curso";
    if (key === "financeiro_status") return "Financeiro"; // <-- MUDANÇA 3: Tratar o novo label
    return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Lógica para pegar opções de filtro
  const financeiroFiltroOpcoes = useMemo(() => {
    if (type !== "Financeiro" || !results) {
      return { cursos: [], status: [] };
    }
    console.log("[Modo Turbo] Gerando opções de filtro para Financeiro...");

    const cursos = new Set<string>();
    const status = new Set<string>();

    results.forEach((item) => {
      if (item.nome_curso) cursos.add(item.nome_curso);
      if (item.status) status.add(item.status);
    });

    return {
      cursos: ["Todos", ...Array.from(cursos).sort()],
      status: ["Todos", ...Array.from(status).sort()],
    };
  }, [type, results]);

  // Lógica para filtrar os resultados
  const filteredResults = useMemo(() => {
    if (type !== "Financeiro" || !results) {
      return results;
    }

    console.log(
      `[Modo Turbo] Filtrando resultados financeiros... Curso: ${financeiroCursoFiltro}, Status: ${financeiroStatusFiltro}`
    );

    return results.filter((item) => {
      const cursoMatch =
        financeiroCursoFiltro === "Todos" ||
        item.nome_curso === financeiroCursoFiltro;
      const statusMatch =
        financeiroStatusFiltro === "Todos" ||
        item.status === financeiroStatusFiltro;
      return cursoMatch && statusMatch;
    });
  }, [results, type, financeiroCursoFiltro, financeiroStatusFiltro]);

  // Renderiza o conteúdo do modal de DETALHES (sem alterações)
  const renderModalContent = () => {
    // ... (lógica do modal de detalhes, sem alteração)
    if (!selectedItem) return null;
    const camposPrincipais = Object.entries(selectedItem).filter(
      ([key]) =>
        !certificadoCamposEscondidos.includes(key) && key !== observacaoKey
    );
    const camposEscondidos = Object.entries(selectedItem).filter(([key]) =>
      certificadoCamposEscondidos.includes(key)
    );
    const valorObservacao = selectedItem[observacaoKey];
    return (
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes de {type}</DialogTitle>
          <DialogDescription>
            Informações completas para{" "}
            {selectedItem.nome || selectedItem.nome_aluno || ""}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
            {camposPrincipais.map(([key, value]) => (
              <div key={key} className="border-b pb-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {formatHeader(key)}
                </p>
                <p className="text-base text-foreground">
                  {String(value) || "N/A"}
                </p>
              </div>
            ))}
            {valorObservacao && (
              <div className="md:col-span-2 border-b pb-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {formatHeader(observacaoKey)}
                </p>
                <p className="text-base text-foreground whitespace-pre-wrap">
                  {String(valorObservacao)}
                </p>
              </div>
            )}
          </div>
          {camposEscondidos.length > 0 && (
            <Accordion type="single" collapsible className="w-full mt-4">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  + Mais Informações (Notas, Grade, etc.)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
                    {camposEscondidos.map(([key, value]) => (
                      <div key={key} className="border-b pb-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          {formatHeader(key)}
                        </p>
                        <p className="text-base text-foreground">
                          {String(value) || "N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setSelectedItem(null)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  };

  // Modal para Form de Ocorrência (Atualizado)
  const renderNovaOcorrenciaModal = () => {
    const nomeAluno = pessoaInfo?.nome;
    const matriculaAluno = pessoaInfo?.cod_pessoa;
    return (
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Ocorrência</DialogTitle>
            <DialogDescription>
              Para o aluno: <span className="font-semibold">{nomeAluno}</span>{" "}
              (Mat: {matriculaAluno})
              <br />
              <span className="text-muted-foreground text-sm">
                (O seu usuário será registrado automaticamente.)
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                value={dataDeHoje}
                readOnly
                disabled
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Ocorrência (Descrição)</Label>
              <Textarea
                id="descricao"
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                placeholder="Descreva a ocorrência..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSalvarOcorrencia} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Função para renderizar os Filtros Financeiros
  const renderFinancialFilters = () => {
    if (type !== "Financeiro" || !results || results.length === 0) {
      return null;
    }

    console.log("[Modo Turbo] Renderizando filtros financeiros...");

    return (
      <div className="bg-card rounded-lg p-4 shadow-subtle mb-6 flex flex-col md:flex-row gap-4">
        {/* Filtro de Curso */}
        <div className="flex-1 space-y-2">
          <Label htmlFor="filtro-curso">Filtrar por Curso</Label>
          <Select
            value={financeiroCursoFiltro}
            onValueChange={setFinanceiroCursoFiltro}
          >
            <SelectTrigger id="filtro-curso" className="w-full">
              <SelectValue placeholder="Selecione um curso..." />
            </SelectTrigger>
            <SelectContent>
              {financeiroFiltroOpcoes.cursos.map((curso) => (
                <SelectItem key={curso} value={curso}>
                  {curso}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Status */}
        <div className="flex-1 space-y-2">
          <Label htmlFor="filtro-status">Filtrar por Status</Label>
          <Select
            value={financeiroStatusFiltro}
            onValueChange={setFinanceiroStatusFiltro}
          >
            <SelectTrigger id="filtro-status" className="w-full">
              <SelectValue placeholder="Selecione um status..." />
            </SelectTrigger>
            <SelectContent>
              {financeiroFiltroOpcoes.status.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  // --- Lógica da Tabela Principal Arrastável ---
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (type === "Relatórios") return [];
    if (!filteredResults || filteredResults.length === 0) {
      return [];
    }
    let headers: string[] = [];
    switch (type) {
      case "Certificado":
        return certificadoTableHeaders.map((header) => ({
          id: header.key,
          accessorKey: header.key,
          header: header.label,
          cell: ({ row }) => {
            const value = row.getValue(header.key);
            return String(value) || "N/A";
          },
        }));
      case "Pessoa":
        headers = pessoaTableHeaders.filter((key) => key in filteredResults[0]);
        break;
      case "Ocorrência":
        headers = ocorrenciaTableHeaders.filter(
          (key) => key in filteredResults[0]
        );
        break;
      case "Requerimento":
        headers = Object.keys(filteredResults[0]).filter(
          (key) => !requerimentoColunasRemovidas.includes(key)
        );
        break;
      default:
        headers = Object.keys(filteredResults[0]);
        break;
    }
    return headers.map((key) => {
      return {
        id: key,
        accessorKey: key,
        header: formatHeader(key),
        cell: ({ row }) => {
          const value = row.getValue(key);
          return value !== null && value !== undefined ? String(value) : "N/A";
        },
      };
    });
  }, [type, filteredResults]);

  useEffect(() => {
    if (type !== "Relatórios") {
      setColumnOrder(columns.map((c) => c.id!));
    }
  }, [columns, type]);

  const table = useReactTable({
    data: filteredResults || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {})
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((currentOrder) => {
        const oldIndex = currentOrder.indexOf(active.id as string);
        const newIndex = currentOrder.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) {
          return currentOrder;
        }
        return arrayMove(currentOrder, oldIndex, newIndex);
      });
    }
  }

  const columnOrderIds = useMemo(() => columnOrder, [columnOrder]);
  // --- FIM da Lógica da Tabela Principal ---

  // --- Funções do Construtor de Relatórios (Sem alteração) ---
  const getActiveReportCols = () => {
    return REPORT_COLUMNS.map((col) => col.id).filter(
      (key) => reportSelectedCols[key]
    );
  };

  const handleReportColumnToggle = (columnId: string) => {
    setReportSelectedCols((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const buildReportUrl = (exportMode: boolean) => {
    const activeCols = getActiveReportCols();
    if (activeCols.length === 0) {
      toast.error("Selecione ao menos uma coluna.");
      return null;
    }

    const params = new URLSearchParams({
      cols: activeCols.join(","),
      curso: selectedCurso,
      consultor: selectedConsultor,
    });

    if (exportMode) {
      params.set("export", "true");
    } else {
      params.set("preview", "true");
    }
    return `http://localhost:5000/api/report_builder?${params.toString()}`;
  };

  const handleUpdatePreview = async () => {
    console.log("[Modo Turbo] Atualizando preview do relatório...");
    setReportLoading(true);

    const url = buildReportUrl(false);
    if (!url) {
      setReportPreviewData([]);
      setReportLoading(false);
      return;
    }

    try {
      const response = await apiFetch(url);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao buscar dados do preview.");
      }
      const data = await response.json();
      console.log("[Modo Turbo] Preview recebido:", data);
      setReportPreviewData(data);
      if (data.length === 0) {
        toast.info("Nenhum dado encontrado para este preview.");
      }
    } catch (err: unknown) {
      console.error("[Modo Turbo] Erro no preview:", err);
      if (!(err instanceof Error && err.message.includes("401"))) {
        toast.error(err instanceof Error ? err.message : "Erro desconhecido.");
      }
      setReportPreviewData([]);
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportCSV = () => {
    console.log("[Modo Turbo] Exportando relatório completo...");
    const url = buildReportUrl(true);
    if (!url) {
      return;
    }

    const downloadFile = async () => {
      try {
        const response = await apiFetch(url); // apiFetch VAI enviar o token
        if (!response.ok) {
          throw new Error("Falha no download");
        }
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = "relatorio_personalizado.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        toast.success("Seu download foi concluído.");
      } catch (err) {
        console.error("Erro ao exportar CSV:", err);
        toast.error("Falha ao exportar CSV.");
      }
    };

    downloadFile();
  };

  // Tabela de Preview (useMemo)
  const previewColumns = useMemo<ColumnDef<any>[]>(() => {
    const activeCols = getActiveReportCols();
    return activeCols.map((colId) => {
      const colConfig = REPORT_COLUMNS.find((c) => c.id === colId);
      return {
        id: colId,
        accessorKey: colId,
        // --- MUDANÇA 4: Usar o 'formatHeader' aqui também ---
        header: colConfig ? colConfig.label : formatHeader(colId),
        // --- FIM DA MUDANÇA 4 ---
        cell: ({ row }) => {
          const value = row.getValue(colId);
          return value !== null && value !== undefined ? String(value) : "N/A";
        },
      };
    });
  }, [reportSelectedCols]);

  const previewTable = useReactTable({
    data: reportPreviewData,
    columns: previewColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Componente de renderização do Construtor de Relatório
  const renderReportBuilder = () => {
    if (query) {
      return (
        <div className="bg-card rounded-lg p-8 text-center shadow-subtle">
          <p className="text-muted-foreground">
            Limpe a busca global para usar o Construtor de Relatórios.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-card rounded-lg p-6 shadow-card space-y-6">
        <h3 className="text-xl font-bold text-foreground">
          Construtor de Relatórios
        </h3>

        {/* Filtros (Curso e Consultor) */}
        <div className="space-y-4">
          <Label className="font-semibold">
            1. Selecione os Filtros (Opcional)
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filtro-curso">Curso</Label>
              <Select value={selectedCurso} onValueChange={setSelectedCurso}>
                <SelectTrigger id="filtro-curso" className="w-full">
                  <SelectValue placeholder="Selecione um curso..." />
                </SelectTrigger>
                <SelectContent>
                  {cursoList.map((curso) => (
                    <SelectItem key={curso} value={curso}>
                      {curso}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filtro-consultor">Consultor</Label>
              <Select
                value={selectedConsultor}
                onValueChange={setSelectedConsultor}
              >
                <SelectTrigger id="filtro-consultor" className="w-full">
                  <SelectValue placeholder="Selecione um consultor..." />
                </SelectTrigger>
                <SelectContent>
                  {consultorList.map((consultor) => (
                    <SelectItem key={consultor} value={consultor}>
                      {consultor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Seleção de Colunas */}
        <div className="space-y-4">
          <Label className="font-semibold">2. Selecione as Colunas</Label>
          {/* --- MUDANÇA 5: Aumentar o grid para caber a nova coluna --- */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 border rounded-md">
            {/* --- FIM DA MUDANÇA 5 --- */}
            {REPORT_COLUMNS.map((col) => (
              <div key={col.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`col-${col.id}`}
                  checked={reportSelectedCols[col.id] || false}
                  onCheckedChange={() => handleReportColumnToggle(col.id)}
                />
                <Label
                  htmlFor={`col-${col.id}`}
                  className="text-sm font-medium"
                >
                  {col.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-4">
          <Button onClick={handleUpdatePreview} disabled={reportLoading}>
            {reportLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Atualizar Preview (5 linhas)
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            disabled={reportLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV Completo
          </Button>
        </div>
      </div>
    );
  };

  // Componente de renderização da Tabela de Preview
  const renderReportPreviewTable = () => {
    if (query) return null;

    if (reportLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (reportPreviewData.length === 0) {
      return (
        <div className="bg-card rounded-lg p-8 text-center shadow-subtle">
          <p className="text-muted-foreground">
            Clique em "Atualizar Preview" para ver os dados aqui.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-card rounded-lg shadow-card overflow-hidden">
        <h3 className="text-lg font-semibold p-4">Preview do Relatório</h3>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-muted">
              {previewTable.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="px-6 py-3 text-left text-sm font-semibold text-foreground capitalize whitespace-nowrap"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {previewTable.getRowModel().rows.map((row, rowIndex) => (
                <TableRow
                  key={row.id}
                  className={
                    rowIndex % 2 === 0 ? "bg-background" : "bg-muted/30"
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-6 py-4 text-sm text-foreground"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  // Tabela Padrão (agora com condicional)
  const renderNewTable = () => {
    if (type === "Relatórios") return null;
    if (isLoading && !filteredResults) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      );
    }
    if (!query) {
      return (
        <div className="bg-card rounded-lg p-8 text-center shadow-subtle">
          <p className="text-muted-foreground">
            <Search className="h-6 w-6 mx-auto mb-2" />
            Digite um nome ou matrícula na barra de busca global acima para ver
            os resultados.
          </p>
        </div>
      );
    }
    if (results !== null && results.length === 0) {
      return (
        <div className="bg-card rounded-lg p-8 text-center shadow-subtle">
          <p className="text-muted-foreground">
            Nenhum resultado encontrado em "{type}" para "
            <span className="font-semibold">{query}</span>".
          </p>
        </div>
      );
    }

    if (
      filteredResults !== null &&
      filteredResults.length === 0 &&
      results &&
      results.length > 0
    ) {
      return (
        <div className="bg-card rounded-lg p-8 text-center shadow-subtle">
          <p className="text-muted-foreground">
            Nenhum resultado encontrado para os filtros selecionados.
          </p>
        </div>
      );
    }

    if (filteredResults !== null && filteredResults.length > 0) {
      return (
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <div className="bg-card rounded-lg shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-muted">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      <SortableContext
                        items={columnOrderIds}
                        strategy={horizontalListSortingStrategy}
                      >
                        {headerGroup.headers.map((header) => (
                          <DraggableColumnHeader
                            key={header.id}
                            header={header}
                          />
                        ))}
                      </SortableContext>
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row, rowIndex) => {
                    const isCertificado = type === "Certificado";
                    const rowClass = `${
                      rowIndex % 2 === 0 ? "bg-background" : "bg-muted/30"
                    } ${
                      isCertificado ? "cursor-pointer hover:bg-muted/60" : ""
                    }`;

                    return (
                      <TableRow
                        key={row.id}
                        className={rowClass}
                        onClick={
                          isCertificado
                            ? () => setSelectedItem(row.original)
                            : undefined
                        }
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="px-6 py-4 text-sm text-foreground"
                            style={
                              cell.column.id === "descricao"
                                ? { minWidth: "300px" }
                                : {}
                            }
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </DndContext>
      );
    }
    return null;
  };

  // Render Principal
  return (
    <>
      <Dialog
        open={selectedItem !== null}
        onOpenChange={(isOpen) => !isOpen && setSelectedItem(null)}
      >
        <div className="space-y-6">
          {type === "Ocorrência" && query && pessoaInfo && (
            <div className="flex justify-end">
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Ocorrência
              </Button>
            </div>
          )}

          {type === "Relatórios" && renderReportBuilder()}
          {renderFinancialFilters()}
          {type === "Relatórios"
            ? renderReportPreviewTable()
            : renderNewTable()}
        </div>

        {renderModalContent()}
      </Dialog>

      {renderNovaOcorrenciaModal()}
    </>
  );
}
