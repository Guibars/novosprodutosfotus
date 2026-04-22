import React from "react";
import { Info, ShieldAlert, Wrench, Bug } from "lucide-react";

export function Help() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sobre o Sistema</h1>
        <p className="text-gray-500 mt-1">Informações importantes sobre a versão atual da plataforma.</p>
      </div>

      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 shadow-xl shadow-black/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-2 shadow-inner">
            <Info className="w-10 h-10 text-primary" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Versão 1.0 Beta</h2>
            <p className="text-gray-500 mt-2 font-medium">Fase de Testes e Ajustes</p>
          </div>

          <div className="bg-white/50 backdrop-blur-md rounded-2xl p-6 border border-white/80 shadow-sm text-left space-y-4 w-full mt-4">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Em Construção</h4>
                <p className="text-sm text-gray-600 mt-1">A plataforma encontra-se atualmente em fase de desenvolvimento contínuo (Beta). Novas funcionalidades estão sendo adicionadas e aprimoradas frequentemente.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <Bug className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Instabilidades e Bugs</h4>
                <p className="text-sm text-gray-600 mt-1">É possível que ocorram lentidões, bugs visuais ou comportamentos inesperados em algumas funcionalidades. Nossa equipe está monitorando ativamente para corrigir.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Reporte Problemas</h4>
                <p className="text-sm text-gray-600 mt-1">Encontrou algum problema ou tem sugestões de melhoria? Por favor, entre em contato reportando o detalhe do ocorrido para que possamos ajustar rapidamente!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
