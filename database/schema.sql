--
-- PostgreSQL database dump
--

\restrict X9coIKPfoKYx9qhsySVeu7eb9AM7hE6rvEkW5POCBdgefuBqkEQr0h3chdpWG9c

-- Dumped from database version 17.12
-- Dumped by pg_dump version 17.12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: billing_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    billing_id uuid NOT NULL,
    item_type character varying(20) NOT NULL,
    reference_id uuid,
    description character varying(200) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    subtotal numeric(15,2) GENERATED ALWAYS AS (((quantity)::numeric * unit_price)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    CONSTRAINT chk_billing_items_price CHECK ((unit_price >= (0)::numeric)),
    CONSTRAINT chk_billing_items_quantity CHECK ((quantity > 0)),
    CONSTRAINT chk_billing_items_type CHECK (((item_type)::text = ANY ((ARRAY['REGISTRATION'::character varying, 'ACTION'::character varying, 'LAB'::character varying, 'MEDICINE'::character varying])::text[])))
);


--
-- Name: billing_items_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.billing_items ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.billing_items_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: billings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    code character varying(30) NOT NULL,
    visit_id uuid NOT NULL,
    total_amount numeric(15,2) DEFAULT 0 NOT NULL,
    paid_amount numeric(15,2) DEFAULT 0 NOT NULL,
    remaining_amount numeric(15,2) GENERATED ALWAYS AS ((total_amount - paid_amount)) STORED,
    status character varying(20) DEFAULT 'UNPAID'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    CONSTRAINT chk_billings_paid CHECK (((paid_amount >= (0)::numeric) AND (paid_amount <= total_amount))),
    CONSTRAINT chk_billings_status CHECK (((status)::text = ANY ((ARRAY['UNPAID'::character varying, 'PARTIAL'::character varying, 'PAID'::character varying])::text[]))),
    CONSTRAINT chk_billings_total CHECK ((total_amount >= (0)::numeric))
);


--
-- Name: billings_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.billings ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.billings_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: doctor_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctor_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    doctor_id uuid NOT NULL,
    polyclinic_id uuid NOT NULL,
    day_of_week smallint NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    code character varying(30) NOT NULL,
    CONSTRAINT chk_doctor_schedules_day CHECK (((day_of_week >= 1) AND (day_of_week <= 7))),
    CONSTRAINT chk_doctor_schedules_time CHECK ((start_time < end_time))
);


--
-- Name: doctor_schedules_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.doctor_schedules ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.doctor_schedules_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: document_sequences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_sequences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    prefix character varying(10) NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    last_number bigint DEFAULT 0 NOT NULL,
    CONSTRAINT chk_sequence_month CHECK (((month >= 1) AND (month <= 12))),
    CONSTRAINT chk_sequence_number CHECK ((last_number >= 0))
);


--
-- Name: document_sequences_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.document_sequences ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.document_sequences_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: lab_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    code character varying(30) NOT NULL,
    visit_id uuid NOT NULL,
    examination_name character varying(150) NOT NULL,
    notes text,
    tariff numeric(15,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    CONSTRAINT chk_lab_requests_status CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[]))),
    CONSTRAINT chk_lab_requests_tariff CHECK ((tariff >= (0)::numeric))
);


--
-- Name: lab_requests_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.lab_requests ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.lab_requests_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: lab_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    lab_request_id uuid NOT NULL,
    result_value text NOT NULL,
    unit character varying(50),
    reference_range character varying(100),
    notes text,
    examined_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


--
-- Name: lab_results_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.lab_results ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.lab_results_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: medical_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medical_actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    code character varying(30) NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    tariff numeric(15,2) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    CONSTRAINT chk_medical_actions_tariff CHECK ((tariff >= (0)::numeric))
);


--
-- Name: medical_actions_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.medical_actions ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.medical_actions_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: medical_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medical_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    visit_id uuid NOT NULL,
    chief_complaint text NOT NULL,
    anamnesis text,
    blood_pressure character varying(20),
    heart_rate integer,
    respiratory_rate integer,
    temperature numeric(4,1),
    oxygen_saturation integer,
    weight numeric(5,2),
    height numeric(5,2),
    physical_examination text,
    primary_diagnosis text,
    secondary_diagnosis text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    code character varying(30) DEFAULT NULL::character varying,
    CONSTRAINT chk_medical_records_heart_rate CHECK ((heart_rate > 0)),
    CONSTRAINT chk_medical_records_height CHECK ((height > (0)::numeric)),
    CONSTRAINT chk_medical_records_oxygen CHECK (((oxygen_saturation >= 0) AND (oxygen_saturation <= 100))),
    CONSTRAINT chk_medical_records_respiratory_rate CHECK ((respiratory_rate > 0)),
    CONSTRAINT chk_medical_records_weight CHECK ((weight > (0)::numeric))
);


--
-- Name: medical_records_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.medical_records ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.medical_records_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: medical_staff; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medical_staff (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    code character varying(30) NOT NULL,
    full_name character varying(150) NOT NULL,
    staff_type character varying(20) NOT NULL,
    specialization character varying(100),
    license_number character varying(100),
    phone character varying(20),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    CONSTRAINT chk_medical_staff_type CHECK (((staff_type)::text = ANY ((ARRAY['DOCTOR'::character varying, 'NURSE'::character varying, 'OTHER'::character varying])::text[])))
);


--
-- Name: medical_staff_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.medical_staff ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.medical_staff_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: medicines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medicines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    code character varying(30) NOT NULL,
    name character varying(150) NOT NULL,
    unit character varying(30) NOT NULL,
    price numeric(15,2) DEFAULT 0 NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    CONSTRAINT chk_medicines_price CHECK ((price >= (0)::numeric)),
    CONSTRAINT chk_medicines_stock CHECK ((stock >= 0))
);


--
-- Name: medicines_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.medicines ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.medicines_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: migration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migration (
    version character varying(180) NOT NULL,
    apply_time integer
);


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    code character varying(30) NOT NULL,
    medical_record_number character varying(30) NOT NULL,
    identity_number character varying(30),
    full_name character varying(150) NOT NULL,
    gender character varying(10) NOT NULL,
    birth_date date NOT NULL,
    phone character varying(20),
    address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    CONSTRAINT chk_patients_gender CHECK (((gender)::text = ANY ((ARRAY['MALE'::character varying, 'FEMALE'::character varying])::text[])))
);


--
-- Name: patients_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.patients ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.patients_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    code character varying(30) NOT NULL,
    billing_id uuid NOT NULL,
    idempotency_key uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    payment_method character varying(20) NOT NULL,
    paid_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_payments_amount CHECK ((amount > (0)::numeric)),
    CONSTRAINT chk_payments_method CHECK (((payment_method)::text = ANY ((ARRAY['CASH'::character varying, 'NON_CASH'::character varying])::text[])))
);


--
-- Name: payments_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.payments ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.payments_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: polyclinics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.polyclinics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    code character varying(30) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


--
-- Name: polyclinics_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.polyclinics ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.polyclinics_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: prescription_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prescription_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    prescription_id uuid NOT NULL,
    medicine_id uuid NOT NULL,
    dosage character varying(100) NOT NULL,
    frequency character varying(100) NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    subtotal numeric(15,2) GENERATED ALWAYS AS (((quantity)::numeric * unit_price)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    CONSTRAINT chk_prescription_items_price CHECK ((unit_price >= (0)::numeric)),
    CONSTRAINT chk_prescription_items_quantity CHECK ((quantity > 0))
);


--
-- Name: prescription_items_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.prescription_items ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.prescription_items_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prescriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    code character varying(30) NOT NULL,
    visit_id uuid NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    dispensed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    CONSTRAINT chk_prescriptions_status CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'DISPENSED'::character varying, 'CANCELLED'::character varying])::text[])))
);


--
-- Name: prescriptions_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.prescriptions ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.prescriptions_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    code character varying(30) NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


--
-- Name: roles_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.roles ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.roles_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    role_id uuid NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(150) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


--
-- Name: users_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: visit_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    visit_id uuid NOT NULL,
    medical_action_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    subtotal numeric(15,2) GENERATED ALWAYS AS (((quantity)::numeric * unit_price)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    CONSTRAINT chk_visit_actions_price CHECK ((unit_price >= (0)::numeric)),
    CONSTRAINT chk_visit_actions_quantity CHECK ((quantity > 0))
);


--
-- Name: visit_actions_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.visit_actions ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.visit_actions_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key bigint NOT NULL,
    code character varying(30) NOT NULL,
    patient_id uuid NOT NULL,
    polyclinic_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    visit_date date NOT NULL,
    queue_number integer NOT NULL,
    status character varying(20) DEFAULT 'WAITING'::character varying NOT NULL,
    registration_fee numeric(15,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    CONSTRAINT chk_visits_fee CHECK ((registration_fee >= (0)::numeric)),
    CONSTRAINT chk_visits_queue CHECK ((queue_number > 0)),
    CONSTRAINT chk_visits_status CHECK (((status)::text = ANY ((ARRAY['WAITING'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[])))
);


--
-- Name: visits_key_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.visits ALTER COLUMN key ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.visits_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: billing_items billing_items_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_key_key UNIQUE (key);


--
-- Name: billing_items billing_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_pkey PRIMARY KEY (id);


--
-- Name: billings billings_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_code_key UNIQUE (code);


--
-- Name: billings billings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_key_key UNIQUE (key);


--
-- Name: billings billings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_pkey PRIMARY KEY (id);


--
-- Name: billings billings_visit_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_visit_id_key UNIQUE (visit_id);


--
-- Name: doctor_schedules doctor_schedules_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_code_key UNIQUE (code);


--
-- Name: doctor_schedules doctor_schedules_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_key_key UNIQUE (key);


--
-- Name: doctor_schedules doctor_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_pkey PRIMARY KEY (id);


--
-- Name: document_sequences document_sequences_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_sequences
    ADD CONSTRAINT document_sequences_key_key UNIQUE (key);


--
-- Name: document_sequences document_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_sequences
    ADD CONSTRAINT document_sequences_pkey PRIMARY KEY (id);


--
-- Name: lab_requests lab_requests_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_requests
    ADD CONSTRAINT lab_requests_code_key UNIQUE (code);


--
-- Name: lab_requests lab_requests_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_requests
    ADD CONSTRAINT lab_requests_key_key UNIQUE (key);


--
-- Name: lab_requests lab_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_requests
    ADD CONSTRAINT lab_requests_pkey PRIMARY KEY (id);


--
-- Name: lab_results lab_results_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_key_key UNIQUE (key);


--
-- Name: lab_results lab_results_lab_request_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_lab_request_id_key UNIQUE (lab_request_id);


--
-- Name: lab_results lab_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_pkey PRIMARY KEY (id);


--
-- Name: medical_actions medical_actions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_actions
    ADD CONSTRAINT medical_actions_code_key UNIQUE (code);


--
-- Name: medical_actions medical_actions_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_actions
    ADD CONSTRAINT medical_actions_key_key UNIQUE (key);


--
-- Name: medical_actions medical_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_actions
    ADD CONSTRAINT medical_actions_pkey PRIMARY KEY (id);


--
-- Name: medical_records medical_records_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_key_key UNIQUE (key);


--
-- Name: medical_records medical_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_pkey PRIMARY KEY (id);


--
-- Name: medical_records medical_records_visit_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_visit_id_key UNIQUE (visit_id);


--
-- Name: medical_staff medical_staff_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_staff
    ADD CONSTRAINT medical_staff_code_key UNIQUE (code);


--
-- Name: medical_staff medical_staff_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_staff
    ADD CONSTRAINT medical_staff_key_key UNIQUE (key);


--
-- Name: medical_staff medical_staff_license_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_staff
    ADD CONSTRAINT medical_staff_license_number_key UNIQUE (license_number);


--
-- Name: medical_staff medical_staff_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_staff
    ADD CONSTRAINT medical_staff_pkey PRIMARY KEY (id);


--
-- Name: medicines medicines_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT medicines_code_key UNIQUE (code);


--
-- Name: medicines medicines_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT medicines_key_key UNIQUE (key);


--
-- Name: medicines medicines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT medicines_pkey PRIMARY KEY (id);


--
-- Name: migration migration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migration
    ADD CONSTRAINT migration_pkey PRIMARY KEY (version);


--
-- Name: patients patients_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_code_key UNIQUE (code);


--
-- Name: patients patients_identity_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_identity_number_key UNIQUE (identity_number);


--
-- Name: patients patients_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_key_key UNIQUE (key);


--
-- Name: patients patients_medical_record_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_medical_record_number_key UNIQUE (medical_record_number);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payments payments_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_code_key UNIQUE (code);


--
-- Name: payments payments_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: payments payments_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_key_key UNIQUE (key);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: polyclinics polyclinics_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.polyclinics
    ADD CONSTRAINT polyclinics_code_key UNIQUE (code);


--
-- Name: polyclinics polyclinics_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.polyclinics
    ADD CONSTRAINT polyclinics_key_key UNIQUE (key);


--
-- Name: polyclinics polyclinics_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.polyclinics
    ADD CONSTRAINT polyclinics_name_key UNIQUE (name);


--
-- Name: polyclinics polyclinics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.polyclinics
    ADD CONSTRAINT polyclinics_pkey PRIMARY KEY (id);


--
-- Name: prescription_items prescription_items_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT prescription_items_key_key UNIQUE (key);


--
-- Name: prescription_items prescription_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT prescription_items_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_code_key UNIQUE (code);


--
-- Name: prescriptions prescriptions_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_key_key UNIQUE (key);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- Name: roles roles_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_key_key UNIQUE (key);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: doctor_schedules uq_doctor_schedule; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT uq_doctor_schedule UNIQUE (doctor_id, polyclinic_id, day_of_week, start_time);


--
-- Name: document_sequences uq_document_sequence; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_sequences
    ADD CONSTRAINT uq_document_sequence UNIQUE (prefix, year, month);


--
-- Name: visits uq_visits_queue; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT uq_visits_queue UNIQUE (visit_date, polyclinic_id, queue_number);


--
-- Name: users users_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_key_key UNIQUE (key);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: visit_actions visit_actions_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_actions
    ADD CONSTRAINT visit_actions_key_key UNIQUE (key);


--
-- Name: visit_actions visit_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_actions
    ADD CONSTRAINT visit_actions_pkey PRIMARY KEY (id);


--
-- Name: visits visits_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_code_key UNIQUE (code);


--
-- Name: visits visits_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_key_key UNIQUE (key);


--
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);


--
-- Name: idx_billing_items_billing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_items_billing ON public.billing_items USING btree (billing_id);


--
-- Name: idx_doctor_schedules_doctor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doctor_schedules_doctor ON public.doctor_schedules USING btree (doctor_id);


--
-- Name: idx_doctor_schedules_polyclinic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doctor_schedules_polyclinic ON public.doctor_schedules USING btree (polyclinic_id);


--
-- Name: idx_lab_requests_visit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_requests_visit ON public.lab_requests USING btree (visit_id);


--
-- Name: idx_medical_staff_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medical_staff_type ON public.medical_staff USING btree (staff_type);


--
-- Name: idx_medicines_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medicines_name ON public.medicines USING btree (name);


--
-- Name: idx_patients_full_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_full_name ON public.patients USING btree (full_name);


--
-- Name: idx_payments_billing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_billing ON public.payments USING btree (billing_id);


--
-- Name: idx_prescription_items_prescription; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prescription_items_prescription ON public.prescription_items USING btree (prescription_id);


--
-- Name: idx_prescriptions_visit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prescriptions_visit ON public.prescriptions USING btree (visit_id);


--
-- Name: idx_users_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role_id ON public.users USING btree (role_id);


--
-- Name: idx_visit_actions_medical_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visit_actions_medical_action ON public.visit_actions USING btree (medical_action_id);


--
-- Name: idx_visit_actions_visit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visit_actions_visit ON public.visit_actions USING btree (visit_id);


--
-- Name: idx_visits_patient_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visits_patient_date ON public.visits USING btree (patient_id, visit_date);


--
-- Name: idx_visits_polyclinic_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visits_polyclinic_date ON public.visits USING btree (polyclinic_id, visit_date);


--
-- Name: uq_medical_records_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_medical_records_code ON public.medical_records USING btree (code);


--
-- Name: uq_visits_active_registration; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_visits_active_registration ON public.visits USING btree (patient_id, polyclinic_id, visit_date) WHERE ((status)::text <> 'CANCELLED'::text);


--
-- Name: billing_items fk_billing_items_billing; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT fk_billing_items_billing FOREIGN KEY (billing_id) REFERENCES public.billings(id) ON DELETE RESTRICT;


--
-- Name: billings fk_billings_visit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT fk_billings_visit FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE RESTRICT;


--
-- Name: doctor_schedules fk_doctor_schedules_doctor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT fk_doctor_schedules_doctor FOREIGN KEY (doctor_id) REFERENCES public.medical_staff(id) ON DELETE RESTRICT;


--
-- Name: doctor_schedules fk_doctor_schedules_polyclinic; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT fk_doctor_schedules_polyclinic FOREIGN KEY (polyclinic_id) REFERENCES public.polyclinics(id) ON DELETE RESTRICT;


--
-- Name: lab_requests fk_lab_requests_visit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_requests
    ADD CONSTRAINT fk_lab_requests_visit FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE RESTRICT;


--
-- Name: lab_results fk_lab_results_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT fk_lab_results_request FOREIGN KEY (lab_request_id) REFERENCES public.lab_requests(id) ON DELETE RESTRICT;


--
-- Name: medical_records fk_medical_records_visit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT fk_medical_records_visit FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE RESTRICT;


--
-- Name: payments fk_payments_billing; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_billing FOREIGN KEY (billing_id) REFERENCES public.billings(id) ON DELETE RESTRICT;


--
-- Name: prescription_items fk_prescription_items_medicine; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT fk_prescription_items_medicine FOREIGN KEY (medicine_id) REFERENCES public.medicines(id) ON DELETE RESTRICT;


--
-- Name: prescription_items fk_prescription_items_prescription; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT fk_prescription_items_prescription FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON DELETE RESTRICT;


--
-- Name: prescriptions fk_prescriptions_visit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT fk_prescriptions_visit FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE RESTRICT;


--
-- Name: users fk_users_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: visit_actions fk_visit_actions_medical_action; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_actions
    ADD CONSTRAINT fk_visit_actions_medical_action FOREIGN KEY (medical_action_id) REFERENCES public.medical_actions(id) ON DELETE RESTRICT;


--
-- Name: visit_actions fk_visit_actions_visit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_actions
    ADD CONSTRAINT fk_visit_actions_visit FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE RESTRICT;


--
-- Name: visits fk_visits_doctor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT fk_visits_doctor FOREIGN KEY (doctor_id) REFERENCES public.medical_staff(id) ON DELETE RESTRICT;


--
-- Name: visits fk_visits_patient; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT fk_visits_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE RESTRICT;


--
-- Name: visits fk_visits_polyclinic; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT fk_visits_polyclinic FOREIGN KEY (polyclinic_id) REFERENCES public.polyclinics(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict X9coIKPfoKYx9qhsySVeu7eb9AM7hE6rvEkW5POCBdgefuBqkEQr0h3chdpWG9c

