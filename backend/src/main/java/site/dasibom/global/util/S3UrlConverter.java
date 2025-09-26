package site.dasibom.global.util;

import org.springframework.stereotype.Component;

@Component
public class S3UrlConverter {

    private static final String S3_BUCKET_NAME = "seoul-ht-06-dasibom";
    private static final String S3_REGION = "us-west-1";
    private static final String S3_BASE_URL = "https://" + S3_BUCKET_NAME + ".s3." + S3_REGION + ".amazonaws.com/";

    /**
     * S3 URI를 HTTP URL로 변환
     * s3://seoul-ht-06-dasibom/path/file.jpg -> https://seoul-ht-06-dasibom.s3.us-west-1.amazonaws.com/path/file.jpg
     */
    public String convertS3UriToHttpUrl(String s3Uri) {
        if (s3Uri == null || !s3Uri.startsWith("s3://")) {
            return s3Uri; // S3 URI가 아니면 그대로 반환
        }

        // s3://bucket-name/path/file.jpg에서 path/file.jpg 추출
        String path = s3Uri.substring(s3Uri.indexOf('/', 5) + 1);

        return S3_BASE_URL + path;
    }

    /**
     * 파일 URL이 S3 URI인지 확인
     */
    public boolean isS3Uri(String url) {
        return url != null && url.startsWith("s3://");
    }
}