import { createApi } from "@reduxjs/toolkit/dist/query/react";
import baseQuery from "@/config/baseQuery";
import { setCertificateList, setCurrentCertificate, setCurrentMintingStatus, setMintingTxData } from "@/store/feature/profile/certificate.slice";
import { Certificate } from "@/types/certificate";

const certificateService = createApi({
  reducerPath: "certificatesService",
  baseQuery: baseQuery(),
  endpoints: (builder) => ({
    fetchAllCertificates: builder.query<Certificate[], { username: string; locale?: string }>({
      query: ({ username, locale }: { username: string; locale?: string }) => ({
        url: `certificates?username=${username}`,
        headers: {
          "accept-language": locale,
        },
      }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCertificateList(data));
        } catch (error) {
          console.log("error", error);
        }
      },
    }),

    findCertificate: builder.query({
      query: ({ id, locale }: { id: string; locale?: string }) => ({
        url: `/certificates/${id}`,
        headers: {
          "accept-language": locale,
        },
      }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCurrentCertificate(data));
          dispatch(setCurrentMintingStatus(!!data?.minting?.tx));
        } catch (error) {
          console.log("error", error);
        }
      },
    }),

    complete: builder.mutation({
      query: ({ id }: { id: string }) => ({
        url: "certificates/complete",
        method: "POST",
        body: {
          certificateId: id,
        },
      }),

      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(setCurrentCertificate(data));
      },
    }),

    mint: builder.mutation({
      query: ({ id, address, signature }) => ({
        url: "certificates/mint",
        method: "POST",
        body: {
          certificateId: id,
          receiver: address,
          signature,
        },
      }),

      onQueryStarted: async (_, { dispatch, queryFulfilled, getState }) => {
        const { data } = await queryFulfilled;
        if (data.certificate) {
          const state: any = getState();
          const currentCertificate = state.profileCertificate.current;
          dispatch(
            setCurrentCertificate({
              ...(currentCertificate || data.certificate),
              minting: data.certificate.minting,
            })
          );
          dispatch(setMintingTxData(data?.txData));
        }
      },
    }),
  }),
});

interface FetchAllCertificatesArgs {
  locale?: string;
  username: string;
}

export const fetchAllCertificates = ({ locale, username }: FetchAllCertificatesArgs) => certificateService.endpoints.fetchAllCertificates.initiate({ locale, username });

interface FindCertificateArgs {
  id: string;
  locale?: string;
}
export const findCertificate = ({ id, locale }: FindCertificateArgs) => certificateService.endpoints.findCertificate.initiate({ id, locale });

interface MintCertificateArgs {
  id: string;
  address: string;
  signature: string;
}
export const mintCertificate = ({ id, address, signature }: MintCertificateArgs) =>
  certificateService.endpoints.mint.initiate({
    id,
    address,
    signature,
  });

export const completeIcpCertificate = ({ id }: { id: string }) => certificateService.endpoints.complete.initiate({ id });

export const { useFetchAllCertificatesQuery, useFindCertificateQuery } = certificateService;
export default certificateService;
