import { API } from "@/lib/api";
import {
  AddParticipantToBillDto,
  BillPaymentResponse,
  BillSettlementResponse,
  CreateBillDto,
} from "@/types/api.types";
import { useMutation } from "@tanstack/react-query";

export const usePostCreateBill = () => {
  return useMutation({
    mutationFn: async (data: CreateBillDto) => {
      const response = await API.post("/bills/create", data);
      return response.data;
    },
  });
};

export const usePostInitiateBillPayment = () => {
  return useMutation({
    mutationFn: async ({
      billId,
      participantAddress,
    }: {
      billId: string;
      participantAddress: string;
    }) => {
      const response = await API.post(`/bills/${billId}/payment`, {
        participantAddress,
      });
      return response.data as BillPaymentResponse;
    },
  });
};

export const usePostAddParticipantToBill = () => {
  return useMutation({
    mutationFn: async (data: AddParticipantToBillDto) => {
      const response = await API.post("/bills/add-participant", data);
      return response.data;
    },
  });
};

export const usePostInitiateBillSettlement = () => {
  return useMutation({
    mutationFn: async ({ billId }: { billId: string }) => {
      const response = await API.post(`/bills/${billId}/settle`);
      return response.data as BillSettlementResponse;
    },
  });
};
