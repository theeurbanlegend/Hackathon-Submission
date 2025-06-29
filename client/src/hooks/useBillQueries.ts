import { API } from "@/lib/api";
import { Bill } from "@/types/api.types";
import { useQuery } from "@tanstack/react-query";

export const useGetBillsByCreator = (creatorAddress: string) => {
  return useQuery({
    queryKey: ["bills", "by-creator", creatorAddress],
    queryFn: async () => {
      const response = await API.get(`/bills/by-creator/${creatorAddress}`);
      return response.data.bills as Bill[];
    },
    enabled: !!creatorAddress,
  });
};

export const useGetBillById = (id: string) => {
  return useQuery({
    queryKey: ["bills", id],
    queryFn: async () => {
      const response = await API.get(`/bills/${id}`);
      return response.data.bill as Bill;
    },
    enabled: !!id,
  });
};

export const useGetParticipantPaymentStatus = (
  billId: string,
  participantAddress: string
) => {
  return useQuery({
    queryKey: ["bills", billId, "participant-status", participantAddress],
    queryFn: async () => {
      const response = await API.get(
        `/bills/${billId}/participant-status/${participantAddress}`
      );
      return response.data.status;
    },
    enabled: !!billId && !!participantAddress,
  });
};

export const useGetBillsByParticipant = (participantAddress: string) => {
  return useQuery({
    queryKey: ["bills", "by-participant", participantAddress],
    queryFn: async () => {
      const response = await API.get(
        `/bills/by-participant/${participantAddress}`
      );
      return response.data.bills as Bill[];
    },
    enabled: !!participantAddress,
  });
};

export const useGetSingleBillByParticipant = (
  billId: string,
  participantAddress: string
) => {
  return useQuery({
    queryKey: ["bills", billId, "by-participant", participantAddress],
    queryFn: async () => {
      const response = await API.get(
        `/bills/bill/by-participant/${billId}/${participantAddress}`
      );
      return response.data.bill as Bill;
    },
    enabled: !!billId && !!participantAddress,
  });
};
